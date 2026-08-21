"use client";

import { useEffect, useRef, useState } from "react";

import { searchSpotifyTracks } from "@/lib/moments";
import type { Song, SpotifyTrack } from "@/types";

type Props = {
    selected: Song | null;
    onSelect: (song: Song | null) => void;
};

const DEBOUNCE_MS = 400;

const songLabel = (song: Song | null) => (song ? `${song.name} — ${song.artist}` : "");

export default function SpotifySearch({ selected, onSelect }: Props) {
    // El texto del input arranca desde la canción ya seleccionada (modo edición).
    // Es un valor inicial, no un efecto de sincronización: derivarlo de `selected`
    // en cada cambio provocaba un render intermedio donde el texto y la selección
    // no coincidían, y eso disparaba una búsqueda fantasma.
    const [queryText, setQueryText] = useState(() => songLabel(selected));
    const [results, setResults] = useState<SpotifyTrack[] | null>(null);
    const [status, setStatus] = useState<"idle" | "searching" | "error">("idle");
    const [showResults, setShowResults] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);

    /** Descarta respuestas de búsquedas que ya quedaron obsoletas. */
    const requestIdRef = useRef(0);

    /** Texto que puso una selección (no el usuario): no hay que buscarlo. */
    const selectionTextRef = useRef(songLabel(selected));

    // Búsqueda con debounce. Depende solo del texto: quién esté seleccionado
    // no debe reabrir el dropdown.
    useEffect(() => {
        const trimmed = queryText.trim();

        // Solo aplica si hay texto de selección: con el input vacío hay que
        // seguir hasta la rama de limpieza de abajo.
        if (selectionTextRef.current && trimmed === selectionTextRef.current) return;

        if (trimmed.length < 2) {
            setResults(null);
            setStatus("idle");
            setShowResults(false);
            return;
        }

        setStatus("searching");
        setShowResults(true);

        const timer = setTimeout(async () => {
            const requestId = ++requestIdRef.current;

            try {
                const tracks = await searchSpotifyTracks(trimmed);
                if (requestId !== requestIdRef.current) return;

                setResults(tracks);
                setStatus("idle");
            } catch (e) {
                console.error(e);
                if (requestId !== requestIdRef.current) return;
                setStatus("error");
            }
        }, DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [queryText]);

    // Cerrar el dropdown al hacer click fuera.
    useEffect(() => {
        if (!showResults) return;

        function handleClickOutside(event: MouseEvent) {
            if (!containerRef.current?.contains(event.target as Node)) setShowResults(false);
        }

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [showResults]);

    function handleSelect(track: SpotifyTrack) {
        const song: Song = {
            id: track.id,
            name: track.name,
            artist: track.artist,
            image: track.image,
            url: track.url
        };

        // Invalida cualquier respuesta en vuelo y cierra el dropdown de una vez.
        requestIdRef.current++;
        selectionTextRef.current = songLabel(song);

        setQueryText(selectionTextRef.current);
        setResults(null);
        setStatus("idle");
        setShowResults(false);

        onSelect(song);
    }

    function handleClear() {
        requestIdRef.current++;
        selectionTextRef.current = "";

        setQueryText("");
        setResults(null);
        setStatus("idle");
        setShowResults(false);

        onSelect(null);
    }

    return (
        <div className="form-control relative" ref={containerRef}>
            <span className="mb-1.5 block text-[11px] uppercase tracking-widest text-white/55">Canción del momento</span>

            <input
                type="text"
                className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/45 focus:outline-none"
                placeholder="Busca una canción..."
                value={queryText}
                onChange={(e) => {
                    setQueryText(e.target.value);
                    // Escribir invalida la selección previa.
                    if (selected) {
                        selectionTextRef.current = "";
                        onSelect(null);
                    }
                }}
                onFocus={() => results && setShowResults(true)}
            />

            {showResults && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-72 overflow-y-auto rounded-2xl border border-white/15 bg-[#2b2233] shadow-xl">
                    {status === "searching" && (
                        <div className="px-4 py-3 text-sm text-white/60">Buscando...</div>
                    )}
                    {status === "error" && (
                        <div className="px-4 py-3 text-sm text-red-300">Error buscando canciones</div>
                    )}
                    {status === "idle" && results?.length === 0 && (
                        <div className="px-4 py-3 text-sm text-white/60">No se encontraron resultados</div>
                    )}
                    {status === "idle" &&
                        results?.map((track, index) => (
                            <button
                                key={track.id}
                                type="button"
                                className={`flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-white/10 ${
                                    index !== results.length - 1 ? "border-b border-white/10" : ""
                                }`}
                                onClick={() => handleSelect(track)}
                            >
                                <img
                                    src={track.image}
                                    alt={track.name}
                                    className="h-12 w-12 rounded-xl object-cover shrink-0"
                                />
                                <div className="min-w-0">
                                    <p className="truncate font-medium text-white">{track.name}</p>
                                    <p className="truncate text-sm text-white/60">{track.artist}</p>
                                </div>
                            </button>
                        ))}
                </div>
            )}

            {selected && (
                <div className="mt-3 rounded-2xl border border-white/15 bg-white/5 p-3">
                    <div className="flex items-center gap-3">
                        {selected.image && (
                            <img
                                src={selected.image}
                                alt="Cover"
                                className="h-12 w-12 rounded-xl object-cover shrink-0"
                            />
                        )}
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-white">{selected.name}</p>
                            <p className="truncate text-sm text-white/60">{selected.artist}</p>
                        </div>
                        <a
                            href={selected.url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full px-3 py-1 text-sm text-white/70 hover:text-white"
                        >
                            Abrir
                        </a>
                        <button type="button" className="rounded-full px-3 py-1 text-sm text-white/70 hover:text-white" onClick={handleClear}>
                            Quitar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

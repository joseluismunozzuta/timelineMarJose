"use client";

import { useEffect, useState } from "react";

import AudioRecorder, { type RecordedAudio } from "@/components/ui/AudioRecorder";
import Modal from "@/components/ui/Modal";
import RatingInput from "@/components/ui/RatingInput";
import {
    SHEET_BODY,
    SHEET_BOX,
    SHEET_BUTTON_GHOST,
    SHEET_BUTTON_PRIMARY,
    SHEET_BUTTON_SOFT,
    SHEET_DIALOG,
    SHEET_FIELD,
    SHEET_FOOTER,
    SHEET_GRABBER,
    SHEET_LABEL,
    SHEET_OPTION
} from "@/components/ui/sheetStyles";
import { feelingsFor } from "@/lib/constants";
import { toDatetimeLocal } from "@/lib/format";
import type { IndexedMoment, Song } from "@/types";

import IntimacyPicker from "./IntimacyPicker";
import SpotifySearch from "./SpotifySearch";

export type MomentDraft = {
    title: string;
    place: string;
    intimacyCount: number;
    song: Song | null;
    description: string;
    rating: number | null;
    feeling: string;
    timestamp: string;
    /** Nota de voz de la que salió la descripción. */
    audio: RecordedAudio | null;
};

type Props = {
    /** "create" pide imagen, descripción, rating y feeling. "edit" solo los datos del momento. */
    mode: "create" | "edit";
    open: boolean;
    /** Solo en modo edición. */
    moment: IndexedMoment | null;
    /** Solo en modo creación: la imagen elegida antes de abrir. */
    imagePreview: string | null;
    genre: string | null;
    /** Nombres de la pareja, como contexto para la transcripción. */
    names: string[];
    onClose: () => void;
    onChangeImage: () => void;
    onSave: (draft: MomentDraft) => Promise<void>;
};

const emptyDraft = (): MomentDraft => ({
    title: "",
    place: "",
    intimacyCount: 0,
    song: null,
    description: "",
    rating: null,
    feeling: "",
    timestamp: toDatetimeLocal(new Date()),
    audio: null
});

export default function MomentModal({
    mode,
    open,
    moment,
    imagePreview,
    genre,
    names,
    onClose,
    onChangeImage,
    onSave
}: Props) {
    const [draft, setDraft] = useState<MomentDraft>(emptyDraft);
    const [noSong, setNoSong] = useState(false);
    const [saving, setSaving] = useState(false);

    /**
     * Cambia en cada apertura del modal y se usa como key de SpotifySearch.
     *
     * Ese componente guarda su propio texto de búsqueda, y como el modal nunca
     * se desmonta, ese texto sobrevive de un momento al siguiente. Cambiar la
     * key lo remonta: es la forma de React de decir "esto es una instancia
     * nueva, olvida tu estado".
     */
    const [sessionKey, setSessionKey] = useState(0);

    const isCreate = mode === "create";

    // Precargar según el modo cada vez que se abre.
    useEffect(() => {
        if (!open) return;

        setSessionKey((current) => current + 1);

        if (isCreate) {
            setDraft(emptyDraft());
            setNoSong(false);
            return;
        }

        if (!moment) return;

        setDraft({
            title: moment.title ?? "",
            place: moment.place ?? "",
            intimacyCount: moment.sex ?? 0,
            song: moment.song ?? null,
            description: "",
            rating: null,
            feeling: "",
            timestamp: moment.timestamp ? toDatetimeLocal(moment.timestamp.toDate()) : "",
            audio: null
        });
        setNoSong(moment.song == null);
    }, [open, mode, moment?.momentId]);

    function update<K extends keyof MomentDraft>(key: K, value: MomentDraft[K]) {
        setDraft((current) => ({ ...current, [key]: value }));
    }

    // Misma regla que el original: sin canción es válido solo si se marcó
    // explícitamente "no tiene canción".
    const songIsValid = noSong || draft.song != null;

    const isValid =
        draft.title.trim() !== "" &&
        draft.place.trim() !== "" &&
        draft.timestamp !== "" &&
        songIsValid &&
        (!isCreate ||
            (draft.description.trim() !== "" && draft.feeling !== "" && draft.rating != null));

    async function handleSave() {
        if (!isValid || saving) return;

        setSaving(true);
        try {
            await onSave({ ...draft, song: noSong ? null : draft.song });
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            dialogClassName={SHEET_DIALOG}
            boxClassName={`${SHEET_BOX} sm:max-w-3xl`}
        >
            <header className="shrink-0 border-b border-white/15 px-5 pb-3 pt-3">
                <div className={`${SHEET_GRABBER} mb-3`} />

                <div className="flex items-center gap-3">
                    <h3 className="min-w-0 flex-1 text-base font-bold leading-tight text-white">
                        {isCreate ? "Registrar momento" : "Editar momento"}
                    </h3>

                    <button
                        type="button"
                        aria-label="Cerrar"
                        onClick={onClose}
                        className="btn btn-circle btn-ghost btn-sm shrink-0 text-white/70 hover:text-white"
                    >
                        ✕
                    </button>
                </div>
            </header>

            <div className={SHEET_BODY}>
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {isCreate && (
                        <div className="space-y-3">
                            {/*
                              object-contain y no cover: la vista previa debe
                              enseñar la foto entera tal y como se va a subir.
                              Con object-cover y altura fija, las fotos verticales
                              salían recortadas por arriba y por abajo.
                            */}
                            <div className="flex items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-black/25">
                                {imagePreview && (
                                    <img
                                        src={imagePreview}
                                        alt="Vista previa del momento"
                                        className="max-h-[45vh] w-auto max-w-full object-contain"
                                    />
                                )}
                            </div>
                            <button type="button" className={SHEET_BUTTON_SOFT} onClick={onChangeImage}>
                                Cambiar imagen
                            </button>
                        </div>
                    )}

                    <div className="space-y-5">
                        <div>
                            <label className={SHEET_LABEL} htmlFor="momentTitle">
                                Título
                            </label>
                            <input
                                id="momentTitle"
                                type="text"
                                className={SHEET_FIELD}
                                value={draft.title}
                                onChange={(e) => update("title", e.target.value)}
                            />
                        </div>

                        <div>
                            <label className={SHEET_LABEL} htmlFor="momentPlace">
                                Lugar
                            </label>
                            <input
                                id="momentPlace"
                                type="text"
                                className={SHEET_FIELD}
                                value={draft.place}
                                onChange={(e) => update("place", e.target.value)}
                            />
                        </div>

                        <IntimacyPicker
                            value={draft.intimacyCount}
                            onChange={(value) => update("intimacyCount", value)}
                        />

                        {!noSong && (
                            <SpotifySearch
                                key={sessionKey}
                                selected={draft.song}
                                onSelect={(song) => update("song", song)}
                            />
                        )}

                        <label className="flex cursor-pointer items-center gap-2 text-sm text-white/80">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-sm border-white/30 bg-white/10"
                                checked={noSong}
                                onChange={(e) => {
                                    setNoSong(e.target.checked);
                                    if (e.target.checked) update("song", null);
                                }}
                            />
                            Este momento no tiene canción
                        </label>

                        <div>
                            <label className={SHEET_LABEL} htmlFor="momentTimestamp">
                                Fecha y hora
                            </label>
                            <input
                                id="momentTimestamp"
                                type="datetime-local"
                                className={`${SHEET_FIELD} [color-scheme:dark]`}
                                value={draft.timestamp}
                                onChange={(e) => update("timestamp", e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {isCreate && (
                    <div className="space-y-5 border-t border-white/10 pt-5">
                        <AudioRecorder
                            names={names}
                            onTranscribed={(text) => update("description", text)}
                            onAudioChange={(audio) => update("audio", audio)}
                        />

                        <div>
                            <label className={SHEET_LABEL} htmlFor="momentDescription">
                                Descripción
                            </label>
                            <textarea
                                id="momentDescription"
                                rows={4}
                                className={`${SHEET_FIELD} leading-relaxed`}
                                value={draft.description}
                                onChange={(e) => update("description", e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <span className={SHEET_LABEL}>Calificación</span>
                                <div className="flex">
                                    <RatingInput
                                        name="rating-newmoment"
                                        value={draft.rating}
                                        onChange={(value) => update("rating", value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={SHEET_LABEL} htmlFor="momentFeeling">
                                    ¿Cómo te sentiste?
                                </label>
                                <select
                                    id="momentFeeling"
                                    className={SHEET_FIELD}
                                    value={draft.feeling}
                                    onChange={(e) => update("feeling", e.target.value)}
                                >
                                    <option disabled value="" className={SHEET_OPTION}>
                                        Selecciona un feeling
                                    </option>
                                    {feelingsFor(genre).map((option) => (
                                        <option key={option} value={option} className={SHEET_OPTION}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <footer className={SHEET_FOOTER}>
                <div className="flex items-center justify-end gap-2">
                    <button type="button" className={SHEET_BUTTON_GHOST} onClick={onClose}>
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className={SHEET_BUTTON_PRIMARY}
                        disabled={!isValid || saving}
                        onClick={handleSave}
                    >
                        {isCreate ? "Guardar momento" : "Guardar cambios"}
                    </button>
                </div>
            </footer>
        </Modal>
    );
}

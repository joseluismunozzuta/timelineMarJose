"use client";

import { useEffect, useRef, useState } from "react";

export type BackgroundLayer = { src: string; id: number };

function shuffle<T>(items: T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

/**
 * Rota el fondo del hero con fundido cruzado.
 *
 * Devuelve como mucho dos capas: la de abajo es la foto que ya se veía y la de
 * arriba la nueva, que entra con la animación .hero-bg-fade. Al llegar la
 * siguiente se descarta la más antigua.
 */
export function useHeroBackground(sources: string[], intervalMs: number) {
    const [layers, setLayers] = useState<BackgroundLayer[]>([]);

    /** Fotos pendientes de la vuelta actual: se agotan antes de repetir. */
    const queueRef = useRef<string[]>([]);
    const lastShownRef = useRef<string | null>(null);
    const idRef = useRef(0);

    function nextSource(): string {
        if (queueRef.current.length === 0) {
            const reshuffled = shuffle(sources);

            // Evita que la última de una vuelta salga también primera en la siguiente.
            if (reshuffled.length > 1 && reshuffled[0] === lastShownRef.current) {
                [reshuffled[0], reshuffled[1]] = [reshuffled[1], reshuffled[0]];
            }

            queueRef.current = reshuffled;
        }

        const src = queueRef.current.shift()!;
        lastShownRef.current = src;
        return src;
    }

    useEffect(() => {
        let cancelled = false;

        // La primera foto se elige aquí y no al renderizar: hacerlo durante el
        // render daría un HTML distinto al pre-generado (error de hidratación).
        setLayers([{ src: nextSource(), id: idRef.current++ }]);

        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReducedMotion || sources.length < 2) return;

        const timer = setInterval(() => {
            // La pestaña oculta no gasta batería en fundidos que nadie ve.
            if (document.hidden) return;

            const next = nextSource();

            // Se precarga antes de montarla: si no, el fundido entraría sobre
            // una capa todavía vacía y se vería un parpadeo.
            const preload = new Image();
            preload.onload = () => {
                if (cancelled) return;
                setLayers((current) => [...current.slice(-1), { src: next, id: idRef.current++ }]);
            };
            preload.src = next;
        }, intervalMs);

        return () => {
            cancelled = true;
            clearInterval(timer);
        };
        // Solo al montar: sources e intervalMs son constantes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return layers;
}

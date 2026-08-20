"use client";

import { useEffect, useState } from "react";

import { chunkMoments, fetchCouple, watchMoments } from "@/lib/moments";
import { MOMENTS_PER_BLOCK } from "@/lib/constants";
import type { CoupleDoc, IndexedMoment } from "@/types";

type TimelineState = {
    loading: boolean;
    error: string | null;
    couple: CoupleDoc | null;
    moments: IndexedMoment[];
    blocks: IndexedMoment[][];
    partnerUid: string | null;
};

/**
 * Estado de la timeline, sincronizado en tiempo real con Firestore.
 *
 * No hay que refrescar nada a mano tras escribir: el listener se dispara solo,
 * tanto con tus cambios (al instante, desde la caché local del SDK) como con
 * los de tu pareja cuando llegan del servidor.
 */
export function useTimeline(coupleId: string | null, myUid: string | null): TimelineState {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [couple, setCouple] = useState<CoupleDoc | null>(null);
    const [moments, setMoments] = useState<IndexedMoment[]>([]);

    // Los datos de la pareja (nombres, miembros) se leen una vez: no cambian
    // mientras la app está abierta.
    useEffect(() => {
        if (!coupleId) return;

        let cancelled = false;

        fetchCouple(coupleId)
            .then((data) => {
                if (!cancelled) setCouple(data);
            })
            .catch((e) => {
                console.error(e);
                if (!cancelled) setError("No se pudieron cargar los datos de la pareja.");
            });

        return () => {
            cancelled = true;
        };
    }, [coupleId]);

    useEffect(() => {
        if (!coupleId) return;

        setLoading(true);

        const unsubscribe = watchMoments(
            coupleId,
            (nextMoments) => {
                setMoments(nextMoments);
                setError(null);
                setLoading(false);
            },
            (e) => {
                console.error(e);
                setError("No se pudieron cargar los momentos.");
                setLoading(false);
            }
        );

        // Sin esto el listener sigue vivo tras cerrar sesión o cambiar de pareja.
        return unsubscribe;
    }, [coupleId]);

    return {
        loading,
        error,
        couple,
        moments,
        blocks: chunkMoments(moments, MOMENTS_PER_BLOCK),
        partnerUid: couple?.members?.find((uid) => uid !== myUid) ?? null
    };
}

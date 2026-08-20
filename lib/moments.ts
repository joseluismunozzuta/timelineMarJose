import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    setDoc,
    Timestamp,
    updateDoc,
    type Unsubscribe
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { db, storage } from "./firebase";
import { compressImage } from "./images";
import type { CoupleDoc, IndexedMoment, Moment, Song, SpotifyTrack } from "@/types";
import { SPOTIFY_SEARCH_URL } from "./constants";

export async function fetchCouple(coupleId: string): Promise<CoupleDoc | null> {
    const snap = await getDoc(doc(db, "couples", coupleId));
    return snap.exists() ? (snap.data() as CoupleDoc) : null;
}

/**
 * Ordena por fecha y reasigna visualIndex 1..N.
 *
 * Se usa al leer de Firestore y también al modificar momentos en memoria,
 * porque un momento nuevo (o una fecha editada) puede caer en medio y
 * desplazar los índices de los siguientes.
 */
export function withVisualIndexes(moments: Moment[]): IndexedMoment[] {
    return [...moments]
        .sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis())
        .map((moment, i) => ({ ...moment, visualIndex: i + 1 }));
}

/**
 * Escucha los momentos en tiempo real.
 *
 * Firestore aplica latency compensation: tras un updateDoc/setDoc, el callback
 * se dispara de inmediato con el cambio local (metadata.hasPendingWrites) y
 * otra vez cuando el servidor confirma. Por eso no hace falta mantener una
 * copia local a mano: escribes y la timeline se repinta sola.
 *
 * Devuelve la función para cancelar la suscripción.
 */
export function watchMoments(
    coupleId: string,
    onChange: (moments: IndexedMoment[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const momentsRef = collection(db, "couples", coupleId, "moments");

    return onSnapshot(
        query(momentsRef, orderBy("timestamp", "asc")),
        (snap) =>
            onChange(
                withVisualIndexes(
                    // serverTimestamps: "estimate" evita que createdAt/updatedAt
                    // lleguen como null mientras la escritura está pendiente.
                    snap.docs.map((d) => d.data({ serverTimestamps: "estimate" }) as Moment)
                )
            ),
        onError
    );
}

/** Parte los momentos en bloques de N; cada bloque será un Swiper. */
export function chunkMoments(moments: IndexedMoment[], size: number): IndexedMoment[][] {
    const blocks: IndexedMoment[][] = [];
    for (let i = 0; i < moments.length; i += size) {
        blocks.push(moments.slice(i, i + size));
    }
    return blocks;
}

type ReviewInput = {
    description: string;
    feeling: string;
    rating: number;
};

/**
 * Guarda o actualiza la reseña del usuario sobre un momento.
 * isNew=true escribe createdAt; isNew=false escribe updatedAt.
 */
export async function saveReview(
    coupleId: string,
    momentId: number,
    uid: string,
    displayName: string,
    review: ReviewInput,
    isNew: boolean
): Promise<void> {
    const momentRef = doc(db, "couples", coupleId, "moments", String(momentId));

    const payload: Record<string, unknown> = {
        [`participants.${uid}.name`]: displayName || "User",
        [`participants.${uid}.description`]: review.description,
        [`participants.${uid}.feeling`]: review.feeling,
        [`participants.${uid}.rating`]: review.rating
    };

    payload[`participants.${uid}.${isNew ? "createdAt" : "updatedAt"}`] = serverTimestamp();

    await updateDoc(momentRef, payload);
}

/** Reserva el siguiente momentId de forma atómica sobre couples/{id}.lastMomentIndex. */
async function getNextMomentId(coupleId: string): Promise<number> {
    const coupleRef = doc(db, "couples", coupleId);

    return runTransaction(db, async (transaction) => {
        const coupleSnap = await transaction.get(coupleRef);
        if (!coupleSnap.exists()) {
            throw new Error("No existe el documento del couple");
        }

        const newIndex = (coupleSnap.data().lastMomentIndex || 0) + 1;
        transaction.update(coupleRef, { lastMomentIndex: newIndex });
        return newIndex;
    });
}

async function uploadMomentImage(file: File, coupleId: string, momentId: number): Promise<string> {
    if (!file.type.startsWith("image/")) {
        throw new Error("El archivo seleccionado no es una imagen");
    }

    const compressed = await compressImage(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.8,
        mimeType: "image/jpeg",
        maxSizeMB: 1
    });

    const storageRef = ref(storage, `moments/${coupleId}/moment_${momentId}.jpg`);
    await uploadBytes(storageRef, compressed, { contentType: "image/jpeg" });

    return getDownloadURL(storageRef);
}

export type CreateMomentInput = {
    title: string;
    place: string;
    intimacyCount: number;
    song: Song | null;
    description: string;
    rating: number | null;
    feeling: string;
    /** valor de <input type="datetime-local"> */
    timestamp: string;
};

export async function createMoment(
    coupleId: string,
    uid: string,
    displayName: string,
    input: CreateMomentInput,
    imageFile: File
): Promise<number> {
    const momentId = await getNextMomentId(coupleId);
    const imageUrl = await uploadMomentImage(imageFile, coupleId, momentId);

    const song = normalizeSong(input.song);
    const timestamp = Timestamp.fromDate(new Date(input.timestamp));

    await setDoc(doc(db, "couples", coupleId, "moments", String(momentId)), {
        createdAt: serverTimestamp(),
        createdBy: uid,
        momentId,
        place: input.place,
        sex: input.intimacyCount,
        timestamp,
        title: input.title,
        urlImg: imageUrl,
        song,
        new: true,
        participants: {
            [uid]: {
                description: input.description,
                feeling: input.feeling,
                name: displayName,
                rating: input.rating,
                createdAt: serverTimestamp()
            }
        }
    });

    return momentId;
}

export type EditMomentInput = {
    title: string;
    place: string;
    intimacyCount: number;
    song: Song | null;
    timestamp: string;
};

export async function editMoment(
    coupleId: string,
    momentId: number,
    input: EditMomentInput
): Promise<void> {
    await updateDoc(doc(db, "couples", coupleId, "moments", String(momentId)), {
        title: input.title,
        place: input.place,
        sex: input.intimacyCount,
        timestamp: Timestamp.fromDate(new Date(input.timestamp)),
        song: normalizeSong(input.song)
    });
}

/**
 * Una canción solo cuenta si tiene nombre, artista y url; si no, se guarda null.
 *
 * La portada es opcional y se persiste para poder mostrarla al editar. Va como
 * null explícito y nunca undefined: Firestore rechaza los valores undefined.
 */
function normalizeSong(song: Song | null): Song | null {
    if (!song?.name?.trim() || !song.artist?.trim() || !song.url?.trim()) return null;

    return {
        name: song.name.trim(),
        artist: song.artist.trim(),
        url: song.url.trim(),
        image: song.image?.trim() || null
    };
}

export async function searchSpotifyTracks(searchQuery: string): Promise<SpotifyTrack[]> {
    const response = await fetch(`${SPOTIFY_SEARCH_URL}?q=${encodeURIComponent(searchQuery)}`);
    if (!response.ok) throw new Error("Error buscando canciones en Spotify");
    return response.json();
}

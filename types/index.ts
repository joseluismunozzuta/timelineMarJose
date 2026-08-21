import type { Timestamp } from "firebase/firestore";

export type Genre = "man" | "woman";

export type UserDoc = {
    email: string;
    displayName: string;
    genre: Genre;
    activeCoupleId: string | null;
    createdAt?: Timestamp;
};

export type CoupleDoc = {
    code: string;
    title?: string;
    members: string[];
    displayNames: Record<string, string>;
    genres: Record<string, Genre>;
    lastMomentIndex?: number;
};

export type Song = {
    name: string;
    artist: string;
    url: string;
    id?: string;
    /**
     * Portada del álbum. null en momentos guardados antes de que se persistiera:
     * hasta entonces solo vivía en memoria tras buscar la canción.
     */
    image?: string | null;
};

/** Reseña de un miembro de la pareja sobre un momento. */
export type Participant = {
    name: string;
    description: string;
    feeling: string;
    rating: number | null;
    /**
     * Nota de voz de la que salió la descripción, en Storage.
     * El texto se puede editar a mano después; el audio es el original.
     */
    audioUrl?: string | null;
    createdAt?: Timestamp | null;
    updatedAt?: Timestamp | null;
};

export type Moment = {
    momentId: number;
    title: string;
    place: string;
    /** Momentos íntimos ese día. El nombre viene del modelo original en Firestore. */
    sex: number;
    timestamp: Timestamp;
    /** Solo en momentos creados desde la app (new: true). Los antiguos usan carousel local. */
    urlImg?: string;
    song: Song | null;
    /** true = momento creado desde la app; false/undefined = momento histórico con carousel. */
    new?: boolean;
    createdBy: string;
    createdAt?: Timestamp;
    participants: Record<string, Participant>;
};

/** Momento + su posición 1..N en la timeline, calculada al leer. */
export type IndexedMoment = Moment & {
    visualIndex: number;
};

export type SpotifyTrack = {
    id: string;
    name: string;
    artist: string;
    image: string;
    url: string;
};

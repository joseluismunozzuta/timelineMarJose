"use client";

import { avatarFor, avatarVariantsFor } from "@/lib/random";
import type { Participant } from "@/types";

type Props = {
    /** Nombre en minúsculas: se usa para elegir la carpeta de avatares. */
    name: string;
    seed: number;
    participant: Participant | null;
    /** true si este lado corresponde al usuario logueado. */
    isMine: boolean;
    onViewReview: () => void;
    onAddReview: () => void;
};

/** Bocadillo: indica que el avatar se puede tocar para leer la reseña. */
function ReadIndicator() {
    return (
        <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-gray-900 ring-2 ring-white/70">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-3.5 w-3.5 text-white"
            >
                <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.4 4.4 0 0 0-1.032-.211 51 51 0 0 0-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 0 0 2.433 3.984L7.28 21.53A.75.75 0 0 1 6 21v-4.03a49 49 0 0 1-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979" />
                <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 0 0 1.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49 49 0 0 0 15.75 7.5" />
            </svg>
        </span>
    );
}

export default function MomentSide({
    name,
    seed,
    participant,
    isMine,
    onViewReview,
    onAddReview
}: Props) {
    const avatarSrc = avatarFor(name, seed, avatarVariantsFor(name));

    // Ya escribió su reseña: avatar a color + feeling, tocable para leerla.
    if (participant) {
        return (
            <div
                className="flex flex-col relative cursor-pointer"
                onClick={onViewReview}
                role="button"
                tabIndex={0}
                aria-label={`Leer la reseña de ${name}`}
            >
                <div className="avatar relative mx-auto transition-transform duration-300 hover:scale-110">
                    <div className="ring-secondary ring-offset-base-100 w-24 rounded-full ring-2 ring-offset-2">
                        <img src={avatarSrc} alt={name} />
                    </div>
                    <ReadIndicator />
                </div>
                <div className="heartbeat absolute -bottom-5 left-1/2 -translate-x-1/2 badge bg-gray-900 text-[8px] px-1 text-white">
                    {participant.feeling ?? ""}
                </div>
            </div>
        );
    }

    // Falta la reseña. Si es la mía, invito a escribirla; si es la del otro,
    // lo digo en voz baja: lo que falta no debe pesar más que lo que hay.
    return (
        <div
            className={`group flex flex-col relative ${isMine ? "cursor-pointer opacity-80 hover:opacity-100" : "opacity-55"}`}
            onClick={isMine ? onAddReview : undefined}
        >
            <div className="avatar mx-auto transition-transform duration-300 group-hover:scale-105">
                <div className="ring-base-300 ring-offset-base-100 w-24 rounded-full ring-2 ring-offset-2">
                    <img src={avatarSrc} alt={name} className="grayscale contrast-75" />
                </div>
            </div>

            {isMine ? (
                <button
                    type="button"
                    className="absolute -bottom-5 left-1/2 -translate-x-1/2 badge badge-outline bg-gray-900 text-[10px] px-2 gap-1 whitespace-nowrap text-white"
                >
                    <span className="text-base leading-none">+</span>
                    <span>Agregar</span>
                </button>
            ) : (
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 badge border-none bg-gray-900/60 text-[9px] px-2 whitespace-nowrap text-white/70">
                    Sin reseña aún
                </span>
            )}
        </div>
    );
}

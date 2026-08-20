"use client";

import { useState } from "react";

import Lightbox from "@/components/ui/Lightbox";
import { legacyImagesFor } from "@/lib/constants";
import type { IndexedMoment } from "@/types";

/** Momentos de fase 1: carousel vertical con las fotos de /public/assets/img/{n}. */
function LegacyCarousel({
    visualIndex,
    onOpenPhoto
}: {
    visualIndex: number;
    onOpenPhoto: (src: string) => void;
}) {
    const images = legacyImagesFor(visualIndex);

    return (
        <div className="mx-4 h-86 carousel carousel-vertical rounded-box">
            {images.map((url) => (
                <div key={url} className="carousel-item h-full flex justify-center">
                    <img
                        src={url}
                        alt=""
                        className="cursor-zoom-in"
                        onClick={() => onOpenPhoto(url)}
                    />
                </div>
            ))}
        </div>
    );
}

/** Momentos creados desde la app: una sola imagen de Storage con efecto 3D. */
function Image3D({ url, onOpenPhoto }: { url: string; onOpenPhoto: (src: string) => void }) {
    return (
        <div className="hover-3d h-86 w-8/12 mx-8">
            <figure className="max-w-100 h-full max-h-fit rounded-2xl">
                <img src={url} alt="" className="cursor-zoom-in" onClick={() => onOpenPhoto(url)} />
            </figure>
            {/* Las 8 capas que el efecto 3D usa como caras. */}
            {Array.from({ length: 8 }, (_, i) => (
                <div key={i} />
            ))}
        </div>
    );
}

export default function MomentImage({ moment }: { moment: IndexedMoment }) {
    // El efecto hover-3d no existe en táctil, así que en móvil la foto no tenía
    // ninguna interacción. Tocarla la abre a pantalla completa.
    const [photo, setPhoto] = useState<string | null>(null);

    return (
        <>
            {moment.new && moment.urlImg ? (
                <Image3D url={moment.urlImg} onOpenPhoto={setPhoto} />
            ) : (
                <LegacyCarousel visualIndex={moment.visualIndex} onOpenPhoto={setPhoto} />
            )}

            <Lightbox src={photo} onClose={() => setPhoto(null)} />
        </>
    );
}

"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

type Props = {
    src: string | null;
    onClose: () => void;
};

/**
 * Foto a pantalla completa.
 *
 * Se monta con un portal en document.body por una razón concreta: el
 * .swiper-wrapper usa transform, y un ancestro con transform se convierte en el
 * bloque contenedor de sus descendientes position:fixed. Es decir, un overlay
 * "fijo" dentro de un slide se posicionaría respecto al carrusel y no respecto
 * a la pantalla. El portal lo saca de ahí.
 */
export default function Lightbox({ src, onClose }: Props) {
    useEffect(() => {
        if (!src) return;

        function handleKey(event: KeyboardEvent) {
            if (event.key === "Escape") onClose();
        }

        // Evita que la página siga desplazándose detrás de la foto.
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", handleKey);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", handleKey);
        };
    }, [src, onClose]);

    if (!src) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 p-4"
            onClick={onClose}
        >
            <img
                src={src}
                alt=""
                className="max-h-full max-w-full rounded-lg object-contain"
                onClick={(e) => e.stopPropagation()}
            />

            <button
                type="button"
                aria-label="Cerrar"
                className="btn btn-circle btn-sm absolute top-4 right-4 border-none bg-white/15 text-white hover:bg-white/25"
                onClick={onClose}
            >
                ✕
            </button>
        </div>,
        document.body
    );
}

"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
    open: boolean;
    onClose: () => void;
    /** Clases extra para el .modal-box. */
    boxClassName?: string;
    /** Clases extra para el <dialog>, p. ej. modal-bottom. */
    dialogClassName?: string;
    children: ReactNode;
};

/**
 * Envoltura sobre <dialog>. Es el caso de useRef del que hablábamos:
 * showModal() y close() son métodos imperativos, no hay forma declarativa
 * de abrir un <dialog> nativo.
 */
export default function Modal({
    open,
    onClose,
    boxClassName = "",
    dialogClassName = "",
    children
}: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open]);

    return (
        // onClose cubre también el ESC y el click en el backdrop, que cierran
        // el <dialog> sin pasar por nuestro estado.
        <dialog ref={dialogRef} className={`modal z-2000 ${dialogClassName}`} onClose={onClose}>
            <div className={`modal-box ${boxClassName}`}>{children}</div>

            <form method="dialog" className="modal-backdrop backdrop-blur-xs">
                <button>close</button>
            </form>
        </dialog>
    );
}

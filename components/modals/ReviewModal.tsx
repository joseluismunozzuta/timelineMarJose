"use client";

import Modal from "@/components/ui/Modal";
import RatingInput from "@/components/ui/RatingInput";
import {
    SHEET_BODY,
    SHEET_BOX,
    SHEET_BUTTON_SOFT,
    SHEET_DIALOG,
    SHEET_FOOTER,
    SHEET_GRABBER
} from "@/components/ui/sheetStyles";
import { formatFullDate } from "@/lib/format";
import { avatarFor, avatarVariantsFor } from "@/lib/random";
import type { IndexedMoment, Participant } from "@/types";

type Props = {
    moment: IndexedMoment | null;
    /** Autor de la reseña que se está viendo. */
    reviewerUid: string | null;
    myUid: string;
    displayNames: Record<string, string>;
    onClose: () => void;
    onEdit: () => void;
};

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export default function ReviewModal({
    moment,
    reviewerUid,
    myUid,
    displayNames,
    onClose,
    onEdit
}: Props) {
    const participant: Participant | null =
        moment && reviewerUid ? moment.participants?.[reviewerUid] ?? null : null;

    const name = (
        participant?.name ??
        (reviewerUid ? displayNames[reviewerUid] : "") ??
        ""
    ).toLowerCase();

    // El avatar usa la misma semilla que el lado del slide, para que coincidan.
    const isOwnerSide = moment ? reviewerUid === moment.createdBy : true;
    const seed = moment ? moment.momentId + (isOwnerSide ? 0 : 1) : 0;

    const dateLabel = participant?.updatedAt
        ? `Actualizado el ${formatFullDate(participant.updatedAt)}`
        : participant?.createdAt
          ? `Agregado el ${formatFullDate(participant.createdAt)}`
          : null;

    return (
        <Modal
            open={moment != null && participant != null}
            onClose={onClose}
            dialogClassName={SHEET_DIALOG}
            boxClassName={`${SHEET_BOX} sm:max-w-lg`}
        >
            {/* Cabecera fija: se queda visible aunque el texto sea largo. */}
            <header className="shrink-0 border-b border-white/15 px-5 pb-4 pt-3">
                <div className={`${SHEET_GRABBER} mb-3`} />

                <div className="flex items-center gap-3">
                    <div className="avatar shrink-0">
                        <div className="w-12 rounded-full ring-2 ring-white/40">
                            {name && (
                                <img src={avatarFor(name, seed, avatarVariantsFor(name))} alt={name} />
                            )}
                        </div>
                    </div>

                    <div className="min-w-0 flex-1 text-left">
                        <p className="text-base font-bold capitalize leading-tight text-white">
                            {name}
                        </p>
                        {dateLabel && (
                            <p className="truncate text-[10px] italic text-white/55">{dateLabel}</p>
                        )}
                    </div>

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

            {/* Cuerpo: lo único que hace scroll. */}
            <div className={SHEET_BODY}>
                {/*
                  Alineado a la izquierda y no justificado: en una columna
                  estrecha, justificar español abre huecos enormes entre palabras.
                */}
                <p className="whitespace-pre-line text-sm leading-relaxed text-white/90">
                    {participant?.description}
                </p>

                {participant?.audioUrl && (
                    <div className="mt-4 rounded-xl bg-black/20 p-3">
                        <p className="mb-2 text-[10px] uppercase tracking-widest text-white/50">
                            Contado con su voz 🎙️
                        </p>
                        <audio controls src={participant.audioUrl} className="w-full" />
                    </div>
                )}
            </div>

            {/* Pie fijo: sentimiento y nota en una sola fila, sin frases de relleno. */}
            <footer className={SHEET_FOOTER}>
                <div className="flex flex-col items-center justify-center gap-3">
                    <span className="rounded-full bg-black/25 px-3 py-1 text-md font-semibold text-white">
                        {participant?.feeling || "Sin feeling"}
                    </span>

                    <RatingInput name="rating-modal" value={participant?.rating ?? null} />
                </div>

                {reviewerUid === myUid && (
                    <button
                        type="button"
                        className={`${SHEET_BUTTON_SOFT} mt-3 w-50 mx-auto flex justify-center`}
                        onClick={onEdit}
                    >
                        Editar mi reseña
                    </button>
                )}
            </footer>
        </Modal>
    );
}

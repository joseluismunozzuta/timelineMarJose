"use client";

import Modal from "@/components/ui/Modal";
import RatingInput from "@/components/ui/RatingInput";
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

    const name = (participant?.name ?? (reviewerUid ? displayNames[reviewerUid] : "") ?? "").toLowerCase();

    // El avatar usa la misma semilla que el lado del slide, para que coincidan.
    const isOwnerSide = moment ? reviewerUid === moment.createdBy : true;
    const seed = moment ? moment.momentId + (isOwnerSide ? 0 : 1) : 0;

    const dateLabel = participant?.updatedAt
        ? `Actualizado el ${formatFullDate(participant.updatedAt)}`
        : participant?.createdAt
          ? `Agregado el ${formatFullDate(participant.createdAt)}`
          : "";

    return (
        <Modal
            open={moment != null && participant != null}
            onClose={onClose}
            boxClassName="m-7 w-10/12 max-h-7/12 bg-mauve-500"
        >
            <div className="flex justify-center">
                <div className="avatar mx-auto transition-transform duration-300 hover:scale-110">
                    <div className="ring-primary ring-offset-base-100 w-16 rounded-full ring-2 ring-offset-2">
                        {name && <img src={avatarFor(name, seed, avatarVariantsFor(name))} alt={name} />}
                    </div>
                </div>
            </div>

            <h3 className="px-2 text-lg text-center text-black font-bold capitalize">{name}:</h3>

            <p className="p-2 text-xs text-justify whitespace-pre-line">
                {participant?.description}
            </p>

            <div className="flex flex-row flex-nowrap justify-center gap-1 my-4">
                <h2 className="text-center text-sm">{capitalize(name)} se sintió:</h2>
                <span className="text-center font-bold text-black text-sm">
                    {participant?.feeling || "Sin feeling registrado"}
                </span>
            </div>

            <div className="flex flex-col justify-center">
                <h2 className="text-center text-xs my-1">y calificó el momento con:</h2>

                <RatingInput name="rating-modal" value={participant?.rating ?? null} />

                <span className="px-2 my-3 text-start italic text-black/60 text-[9px]">{dateLabel}</span>

                {reviewerUid === myUid && (
                    <button
                        type="button"
                        className="btn btn-primary btn-sm w-1/3 mx-auto my-2"
                        onClick={onEdit}
                    >
                        Editar
                    </button>
                )}
            </div>
        </Modal>
    );
}

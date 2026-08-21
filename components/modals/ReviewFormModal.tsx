"use client";

import { useEffect, useState } from "react";

import AudioRecorder, { type RecordedAudio } from "@/components/ui/AudioRecorder";
import Modal from "@/components/ui/Modal";
import RatingInput from "@/components/ui/RatingInput";
import { feelingsFor } from "@/lib/constants";
import type { IndexedMoment, Participant } from "@/types";

export type ReviewDraft = {
    description: string;
    feeling: string;
    rating: number;
    /** Grabación nueva. null = no se grabó nada en esta edición. */
    audio: RecordedAudio | null;
};

type Props = {
    moment: IndexedMoment | null;
    /** "add" escribe createdAt; "edit" escribe updatedAt. */
    mode: "add" | "edit";
    genre: string | null;
    existing: Participant | null;
    /** Nombres de la pareja, como contexto para la transcripción. */
    names: string[];
    onClose: () => void;
    onSave: (draft: ReviewDraft) => Promise<void>;
};

export default function ReviewFormModal({
    moment,
    mode,
    genre,
    existing,
    names,
    onClose,
    onSave
}: Props) {
    const [description, setDescription] = useState("");
    const [feeling, setFeeling] = useState("");
    const [rating, setRating] = useState(0);
    const [audio, setAudio] = useState<RecordedAudio | null>(null);
    const [saving, setSaving] = useState(false);

    const open = moment != null;

    // Al abrir, precargar con lo que ya haya escrito (o vaciar si es nueva).
    useEffect(() => {
        if (!open) return;

        setDescription(existing?.description ?? "");
        setFeeling(existing?.feeling ?? "");
        setRating(existing?.rating ?? 0);
        setAudio(null);
    }, [open, moment?.momentId, mode]);

    async function handleSave() {
        setSaving(true);
        try {
            await onSave({ description: description.trim(), feeling, rating, audio });
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            boxClassName="mx-7 my-4 w-10/12 max-h-[90vh] bg-mauve-500 overflow-y-auto"
        >
            <h3 className="text-lg text-center font-bold">
                {mode === "edit" ? "Editar reseña" : "Escribir reseña"}
            </h3>

            <p className="py-2 px-2 text-xs text-justify opacity-80">
                Completa cómo te sentiste y cómo calificarías este momento.
            </p>

            <div className="flex flex-col gap-4 mt-4">
                <AudioRecorder
                    names={names}
                    existingAudioUrl={existing?.audioUrl}
                    onTranscribed={setDescription}
                    onAudioChange={setAudio}
                />

                <div className="form-control">
                    <label className="label" htmlFor="reviewText">
                        <span className="label-text font-semibold">Descripción</span>
                    </label>
                    <textarea
                        id="reviewText"
                        className="textarea textarea-bordered w-full my-1 min-h-56 text-sm bg-base-100 text-base-content"
                        placeholder="Escribe aquí tu comentario sobre este momento..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className="form-control">
                    <label className="label" htmlFor="reviewFeeling">
                        <span className="label-text font-semibold">¿Cómo te sentiste?</span>
                    </label>
                    <select
                        id="reviewFeeling"
                        className="select select-bordered w-full bg-base-100 text-base-content"
                        value={feeling}
                        onChange={(e) => setFeeling(e.target.value)}
                    >
                        <option disabled value="">
                            Selecciona un feeling
                        </option>
                        {feelingsFor(genre).map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-control">
                    <label className="label justify-center">
                        <span className="label-text font-semibold">Calificación del momento</span>
                    </label>
                    <div className="flex justify-center">
                        <RatingInput name="rating-registermodal" value={rating} onChange={setRating} />
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                    <button type="button" className="btn btn-ghost" onClick={onClose}>
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        Guardar
                    </button>
                </div>
            </div>
        </Modal>
    );
}

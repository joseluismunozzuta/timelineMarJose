"use client";

import { useEffect, useState } from "react";

import AudioRecorder, { type RecordedAudio } from "@/components/ui/AudioRecorder";
import Modal from "@/components/ui/Modal";
import RatingInput from "@/components/ui/RatingInput";
import {
    SHEET_BODY,
    SHEET_BOX,
    SHEET_BUTTON_GHOST,
    SHEET_BUTTON_PRIMARY,
    SHEET_DIALOG,
    SHEET_FIELD,
    SHEET_FOOTER,
    SHEET_GRABBER,
    SHEET_LABEL,
    SHEET_OPTION
} from "@/components/ui/sheetStyles";
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
            dialogClassName={SHEET_DIALOG}
            boxClassName={`${SHEET_BOX} sm:max-w-lg`}
        >
            <header className="shrink-0 border-b border-white/15 px-5 pb-3 pt-3">
                <div className={`${SHEET_GRABBER} mb-3`} />

                <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1 text-left">
                        <h3 className="text-base font-bold leading-tight text-white">
                            {mode === "edit" ? "Editar reseña" : "Escribir reseña"}
                        </h3>
                        <p className="text-[11px] text-white/50">
                            Cómo te sentiste y cómo lo calificarías
                        </p>
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

            <div className={SHEET_BODY}>
                <AudioRecorder
                    names={names}
                    existingAudioUrl={existing?.audioUrl}
                    onTranscribed={setDescription}
                    onAudioChange={setAudio}
                />

                <div>
                    <label className={SHEET_LABEL} htmlFor="reviewText">
                        Descripción
                    </label>
                    <textarea
                        id="reviewText"
                        className={`${SHEET_FIELD} min-h-44 leading-relaxed`}
                        placeholder="Escribe aquí tu comentario sobre este momento..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div>
                    <label className={SHEET_LABEL} htmlFor="reviewFeeling">
                        ¿Cómo te sentiste?
                    </label>
                    <select
                        id="reviewFeeling"
                        className={SHEET_FIELD}
                        value={feeling}
                        onChange={(e) => setFeeling(e.target.value)}
                    >
                        <option disabled value="" className={SHEET_OPTION}>
                            Selecciona un feeling
                        </option>
                        {feelingsFor(genre).map((option) => (
                            <option key={option} value={option} className={SHEET_OPTION}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <span className={`${SHEET_LABEL} text-center`}>Calificación del momento</span>
                    <div className="flex justify-center">
                        <RatingInput name="rating-registermodal" value={rating} onChange={setRating} />
                    </div>
                </div>
            </div>

            <footer className={SHEET_FOOTER}>
                <div className="flex items-center justify-end gap-2">
                    <button type="button" className={SHEET_BUTTON_GHOST} onClick={onClose}>
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className={SHEET_BUTTON_PRIMARY}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        Guardar
                    </button>
                </div>
            </footer>
        </Modal>
    );
}

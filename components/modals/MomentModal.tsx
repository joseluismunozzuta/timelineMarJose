"use client";

import { useEffect, useState } from "react";

import AudioRecorder, { type RecordedAudio } from "@/components/ui/AudioRecorder";
import Modal from "@/components/ui/Modal";
import RatingInput from "@/components/ui/RatingInput";
import { feelingsFor } from "@/lib/constants";
import { toDatetimeLocal } from "@/lib/format";
import type { IndexedMoment, Song } from "@/types";

import IntimacyPicker from "./IntimacyPicker";
import SpotifySearch from "./SpotifySearch";

export type MomentDraft = {
    title: string;
    place: string;
    intimacyCount: number;
    song: Song | null;
    description: string;
    rating: number | null;
    feeling: string;
    timestamp: string;
    /** Nota de voz de la que salió la descripción. */
    audio: RecordedAudio | null;
};

type Props = {
    /** "create" pide imagen, descripción, rating y feeling. "edit" solo los datos del momento. */
    mode: "create" | "edit";
    open: boolean;
    /** Solo en modo edición. */
    moment: IndexedMoment | null;
    /** Solo en modo creación: la imagen elegida antes de abrir. */
    imagePreview: string | null;
    genre: string | null;
    /** Nombres de la pareja, como contexto para la transcripción. */
    names: string[];
    onClose: () => void;
    onChangeImage: () => void;
    onSave: (draft: MomentDraft) => Promise<void>;
};

const emptyDraft = (): MomentDraft => ({
    title: "",
    place: "",
    intimacyCount: 0,
    song: null,
    description: "",
    rating: null,
    feeling: "",
    timestamp: toDatetimeLocal(new Date()),
    audio: null
});

export default function MomentModal({
    mode,
    open,
    moment,
    imagePreview,
    genre,
    names,
    onClose,
    onChangeImage,
    onSave
}: Props) {
    const [draft, setDraft] = useState<MomentDraft>(emptyDraft);
    const [noSong, setNoSong] = useState(false);
    const [saving, setSaving] = useState(false);

    /**
     * Cambia en cada apertura del modal y se usa como key de SpotifySearch.
     *
     * Ese componente guarda su propio texto de búsqueda, y como el modal nunca
     * se desmonta, ese texto sobrevive de un momento al siguiente. Cambiar la
     * key lo remonta: es la forma de React de decir "esto es una instancia
     * nueva, olvida tu estado".
     */
    const [sessionKey, setSessionKey] = useState(0);

    const isCreate = mode === "create";

    // Precargar según el modo cada vez que se abre.
    useEffect(() => {
        if (!open) return;

        setSessionKey((current) => current + 1);

        if (isCreate) {
            setDraft(emptyDraft());
            setNoSong(false);
            return;
        }

        if (!moment) return;

        setDraft({
            title: moment.title ?? "",
            place: moment.place ?? "",
            intimacyCount: moment.sex ?? 0,
            song: moment.song ?? null,
            description: "",
            rating: null,
            feeling: "",
            timestamp: moment.timestamp ? toDatetimeLocal(moment.timestamp.toDate()) : "",
            audio: null
        });
        setNoSong(moment.song == null);
    }, [open, mode, moment?.momentId]);

    function update<K extends keyof MomentDraft>(key: K, value: MomentDraft[K]) {
        setDraft((current) => ({ ...current, [key]: value }));
    }

    // Misma regla que el original: sin canción es válido solo si se marcó
    // explícitamente "no tiene canción".
    const songIsValid = noSong || draft.song != null;

    const isValid =
        draft.title.trim() !== "" &&
        draft.place.trim() !== "" &&
        draft.timestamp !== "" &&
        songIsValid &&
        (!isCreate ||
            (draft.description.trim() !== "" && draft.feeling !== "" && draft.rating != null));

    async function handleSave() {
        if (!isValid || saving) return;

        setSaving(true);
        try {
            await onSave({ ...draft, song: noSong ? null : draft.song });
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            boxClassName="mx-3 w-11/12 my-4 max-w-4xl p-0 overflow-y-scroll max-h-[90vh]"
        >
            <div className="flex items-center justify-between px-6 py-4 border-b border-base-300 bg-base-200">
                <h3 className="text-xl text-center font-bold">
                    {isCreate ? "Registrar momento" : "Editar momento"}
                </h3>
                <button type="button" className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
                    ✕
                </button>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {isCreate && (
                        <div className="space-y-4">
                            <div className="rounded-3xl overflow-hidden border border-base-300 bg-base-200">
                                {imagePreview && (
                                    <img
                                        src={imagePreview}
                                        alt="Vista previa del momento"
                                        className="w-full h-95 object-cover"
                                    />
                                )}
                            </div>
                            <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={onChangeImage}
                            >
                                Cambiar imagen
                            </button>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="form-control">
                            <span className="label-text font-medium mb-2">Título</span>
                            <input
                                type="text"
                                className="input input-bordered w-full"
                                value={draft.title}
                                onChange={(e) => update("title", e.target.value)}
                            />
                        </div>

                        <div className="form-control">
                            <span className="label-text font-medium mb-2">Lugar</span>
                            <input
                                type="text"
                                className="input input-bordered w-full"
                                value={draft.place}
                                onChange={(e) => update("place", e.target.value)}
                            />
                        </div>

                        <IntimacyPicker
                            value={draft.intimacyCount}
                            onChange={(value) => update("intimacyCount", value)}
                        />

                        {!noSong && (
                            <SpotifySearch
                                key={sessionKey}
                                selected={draft.song}
                                onSelect={(song) => update("song", song)}
                            />
                        )}

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-sm"
                                checked={noSong}
                                onChange={(e) => {
                                    setNoSong(e.target.checked);
                                    if (e.target.checked) update("song", null);
                                }}
                            />
                            <span className="label-text">Este momento no tiene canción</span>
                        </label>

                        {isCreate && (
                            <>
                                <AudioRecorder
                                    names={names}
                                    onTranscribed={(text) => update("description", text)}
                                    onAudioChange={(audio) => update("audio", audio)}
                                />

                                <div className="form-control">
                                    <span className="label-text font-medium mb-2">Descripción</span>
                                    <textarea
                                        rows={4}
                                        className="textarea textarea-bordered w-full"
                                        value={draft.description}
                                        onChange={(e) => update("description", e.target.value)}
                                    />
                                </div>

                                <div className="form-control">
                                    <span className="label-text font-medium mb-2">Calificación</span>
                                    <div className="flex justify-center">
                                        <RatingInput
                                            name="rating-newmoment"
                                            value={draft.rating}
                                            onChange={(value) => update("rating", value)}
                                        />
                                    </div>
                                </div>

                                <div className="form-control">
                                    <span className="label-text font-medium mb-2">
                                        ¿Cómo te sentiste?
                                    </span>
                                    <select
                                        className="select select-bordered w-full"
                                        value={draft.feeling}
                                        onChange={(e) => update("feeling", e.target.value)}
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
                            </>
                        )}

                        <div className="form-control">
                            <span className="label-text font-medium mb-2">Fecha y hora</span>
                            <input
                                type="datetime-local"
                                className="input input-bordered w-full"
                                value={draft.timestamp}
                                onChange={(e) => update("timestamp", e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-base-300">
                    <button type="button" className="btn btn-ghost" onClick={onClose}>
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className={`btn btn-primary ${isValid ? "" : "btn-disabled"}`}
                        disabled={!isValid || saving}
                        onClick={handleSave}
                    >
                        {isCreate ? "Guardar momento" : "Guardar cambios"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

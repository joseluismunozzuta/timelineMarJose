"use client";

import { useState } from "react";

import { getFirebaseAuthErrorMessage, registerUser } from "@/lib/users";
import type { Genre } from "@/types";

type Props = {
    open: boolean;
    onClose: () => void;
    onBusyChange: (busy: boolean) => void;
};

export default function RegisterModal({ open, onClose, onBusyChange }: Props) {
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [genre, setGenre] = useState<Genre | "">("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    if (!open) return null;

    async function handleSubmit() {
        setError(null);

        if (!displayName.trim()) return setError("El nombre es obligatorio.");
        if (!email.trim()) return setError("El email es obligatorio.");
        if (!password.trim()) return setError("La contraseña es obligatoria.");
        if (!genre) return setError("Debes seleccionar hombre o mujer.");

        setSubmitting(true);
        onBusyChange(true);

        try {
            await registerUser({
                displayName: displayName.trim(),
                email: email.trim(),
                password: password.trim(),
                genre
            });
            // AuthProvider detecta la sesión nueva y cambia de vista solo.
            onClose();
        } catch (e) {
            setError(getFirebaseAuthErrorMessage(e as { code?: string }));
            onBusyChange(false);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-800">Crear cuenta</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
                    >
                        ×
                    </button>
                </div>

                <div className="mt-4 space-y-3">
                    <input
                        type="text"
                        className="input input-bordered w-full"
                        placeholder="Nombre"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                    />
                    <input
                        type="email"
                        className="input input-bordered w-full"
                        placeholder="correo@ejemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        className="input input-bordered w-full"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <select
                        className="select select-bordered w-full"
                        value={genre}
                        onChange={(e) => setGenre(e.target.value as Genre)}
                    >
                        <option value="" disabled>
                            Selecciona
                        </option>
                        <option value="man">Hombre</option>
                        <option value="woman">Mujer</option>
                    </select>
                </div>

                {error && (
                    <div className="mt-4 rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="mt-6 flex justify-end gap-2">
                    <button type="button" className="btn btn-ghost" onClick={onClose}>
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="rounded-xl bg-pink-600 px-4 py-2 text-white hover:bg-pink-700"
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        Registrarse
                    </button>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";

import Loader from "@/components/Loader";
import { useAuth } from "@/components/AuthProvider";
import { createCouple, joinCoupleByCode } from "@/lib/users";

export default function CoupleSetupView() {
    const { uid, userDoc, refreshUserDoc, logout } = useAuth();

    const [joinCode, setJoinCode] = useState("");
    const [joinError, setJoinError] = useState<string | null>(null);

    const [createCode, setCreateCode] = useState("");
    const [createDocId, setCreateDocId] = useState("");
    const [createTitle, setCreateTitle] = useState("");
    const [createError, setCreateError] = useState<string | null>(null);

    const [busy, setBusy] = useState(false);

    async function handleJoin() {
        setJoinError(null);

        if (!joinCode.trim()) {
            setJoinError("Debes ingresar un código.");
            return;
        }

        setBusy(true);

        try {
            const result = await joinCoupleByCode(
                joinCode.trim(),
                uid!,
                userDoc!.displayName,
                userDoc!.genre
            );

            if (!result.ok) {
                setJoinError(result.error);
                return;
            }

            await refreshUserDoc();
        } catch (e) {
            console.error(e);
            setJoinError("No se pudo unir a la pareja.");
        } finally {
            setBusy(false);
        }
    }

    async function handleCreate() {
        setCreateError(null);

        if (!createCode.trim() || !createDocId.trim() || !createTitle.trim()) {
            setCreateError("Completa código, identificador y título.");
            return;
        }

        setBusy(true);

        try {
            const result = await createCouple({
                code: createCode.trim(),
                docId: createDocId.trim(),
                title: createTitle.trim(),
                uid: uid!,
                displayName: userDoc!.displayName,
                genre: userDoc!.genre
            });

            if (!result.ok) {
                setCreateError(result.error);
                return;
            }

            await refreshUserDoc();
        } catch (e) {
            console.error(e);
            setCreateError("No se pudo crear la pareja.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <>
            <Loader show={busy} />

            <section className="min-h-screen bg-pink-700 p-6">
                <button
                    type="button"
                    onClick={logout}
                    className="btn btn-ghost btn-sm text-white mb-4"
                >
                    Cerrar sesión
                </button>

                <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
                    <div className="rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-gray-800">Crear pareja</h2>

                        <div className="mt-4 space-y-3">
                            <input
                                type="text"
                                className="input input-bordered w-full"
                                placeholder="Código para invitar"
                                value={createCode}
                                onChange={(e) => setCreateCode(e.target.value)}
                            />
                            <input
                                type="text"
                                className="input input-bordered w-full"
                                placeholder="Identificador (ej. couple_mar_jose)"
                                value={createDocId}
                                onChange={(e) => setCreateDocId(e.target.value)}
                            />
                            <input
                                type="text"
                                className="input input-bordered w-full"
                                placeholder="Título"
                                value={createTitle}
                                onChange={(e) => setCreateTitle(e.target.value)}
                            />
                        </div>

                        {createError && (
                            <div className="mt-4 rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
                                {createError}
                            </div>
                        )}

                        <button
                            type="button"
                            className="mt-6 w-full rounded-xl bg-pink-600 px-4 py-2 text-white hover:bg-pink-700"
                            onClick={handleCreate}
                            disabled={busy}
                        >
                            Crear
                        </button>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-gray-800">Unirse a una pareja</h2>

                        <input
                            type="text"
                            className="input input-bordered mt-4 w-full"
                            placeholder="Código de invitación"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                        />

                        {joinError && (
                            <div className="mt-4 rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
                                {joinError}
                            </div>
                        )}

                        <button
                            type="button"
                            className="mt-6 w-full rounded-xl bg-pink-600 px-4 py-2 text-white hover:bg-pink-700"
                            onClick={handleJoin}
                            disabled={busy}
                        >
                            Unirme
                        </button>
                    </div>
                </div>
            </section>
        </>
    );
}

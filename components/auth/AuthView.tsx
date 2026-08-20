"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";

import Loader from "@/components/Loader";
import { auth } from "@/lib/firebase";
import RegisterModal from "./RegisterModal";

export default function AuthView({ initialError }: { initialError?: string | null }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(initialError ?? null);
    const [busy, setBusy] = useState(false);
    const [registerOpen, setRegisterOpen] = useState(false);

    async function handleLogin() {
        setError(null);

        if (!email || !password) {
            setError("Completa email y contraseña.");
            return;
        }

        setBusy(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // AuthProvider se encarga de cambiar de vista.
        } catch (e) {
            console.error(e);
            setError("No se pudo iniciar sesión. Revisa credenciales.");
            setBusy(false);
        }
    }

    return (
        <>
            <Loader show={busy} />

            <section className="min-h-screen flex items-center justify-center p-6 bg-pink-700">
                <div className="card w-full max-w-sm bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title justify-center">Mar &amp; Jose</h2>

                        <label className="form-control w-full">
                            <span className="label-text">Email</span>
                            <input
                                type="email"
                                className="input input-bordered w-full"
                                placeholder="correo@ejemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                            />
                        </label>

                        <label className="form-control w-full mt-2">
                            <span className="label-text">Contraseña</span>
                            <input
                                type="password"
                                className="input input-bordered w-full"
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                            />
                        </label>

                        {error && <div className="alert alert-error mt-4 text-sm">{error}</div>}

                        <div className="card-actions justify-between mt-6">
                            <button
                                type="button"
                                className="btn btn-secondary btn-outline"
                                onClick={() => setRegisterOpen(true)}
                            >
                                Registrarse
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary shadow-lg shadow-gray-600"
                                onClick={handleLogin}
                                disabled={busy}
                            >
                                Entrar
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <RegisterModal
                open={registerOpen}
                onClose={() => setRegisterOpen(false)}
                onBusyChange={setBusy}
            />
        </>
    );
}

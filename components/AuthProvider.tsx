"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { waitForUserDoc } from "@/lib/users";
import type { UserDoc } from "@/types";

/**
 * loading  -> aún no sabemos si hay sesión
 * auth     -> no hay sesión, mostrar login
 * setup    -> hay sesión pero sin pareja activa
 * app      -> hay sesión y pareja, mostrar timeline
 */
export type AuthStage = "loading" | "auth" | "setup" | "app";

type AuthContextValue = {
    stage: AuthStage;
    user: User | null;
    userDoc: UserDoc | null;
    uid: string | null;
    coupleId: string | null;
    error: string | null;
    logout: () => Promise<void>;
    /** Releer el doc de usuario tras crear o unirse a una pareja. */
    refreshUserDoc: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [stage, setStage] = useState<AuthStage>("loading");
    const [user, setUser] = useState<User | null>(null);
    const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        return onAuthStateChanged(auth, async (nextUser) => {
            if (!nextUser) {
                setUser(null);
                setUserDoc(null);
                setError(null);
                setStage("auth");
                return;
            }

            setUser(nextUser);

            const doc = await waitForUserDoc(nextUser.uid);

            if (!doc) {
                setError("No se encontró información del usuario.");
                setStage("auth");
                return;
            }

            setUserDoc(doc);
            setStage(doc.activeCoupleId ? "app" : "setup");
        });
    }, []);

    async function refreshUserDoc() {
        if (!auth.currentUser) return;

        const doc = await waitForUserDoc(auth.currentUser.uid);
        if (!doc) return;

        setUserDoc(doc);
        setStage(doc.activeCoupleId ? "app" : "setup");
    }

    async function logout() {
        await signOut(auth);
    }

    return (
        <AuthContext.Provider
            value={{
                stage,
                user,
                userDoc,
                uid: user?.uid ?? null,
                coupleId: userDoc?.activeCoupleId ?? null,
                error,
                logout,
                refreshUserDoc
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
    return context;
}

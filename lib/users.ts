import { createUserWithEmailAndPassword } from "firebase/auth";
import {
    arrayUnion,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from "firebase/firestore";

import { auth, db } from "./firebase";
import type { Genre, UserDoc } from "@/types";

export function getFirebaseAuthErrorMessage(error: { code?: string }): string {
    switch (error?.code) {
        case "auth/email-already-in-use":
            return "Ese correo ya está registrado.";
        case "auth/invalid-email":
            return "El correo no es válido.";
        case "auth/weak-password":
            return "La contraseña debe tener al menos 6 caracteres.";
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
            return "Correo o contraseña incorrectos.";
        default:
            return "Ocurrió un error. Inténtalo nuevamente.";
    }
}

export async function fetchUser(uid: string): Promise<UserDoc | null> {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? (snap.data() as UserDoc) : null;
}

/**
 * El doc de usuario se crea justo después del signup, así que en el primer
 * onAuthStateChanged puede no existir todavía.
 */
export async function waitForUserDoc(uid: string, retries = 10, delayMs = 300): Promise<UserDoc | null> {
    for (let i = 0; i < retries; i++) {
        const user = await fetchUser(uid);
        if (user) return user;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    return null;
}

export async function registerUser(params: {
    displayName: string;
    email: string;
    password: string;
    genre: Genre;
}): Promise<void> {
    const credential = await createUserWithEmailAndPassword(auth, params.email, params.password);

    await setDoc(doc(db, "users", credential.user.uid), {
        email: params.email,
        displayName: params.displayName,
        genre: params.genre,
        activeCoupleId: null,
        createdAt: serverTimestamp()
    });
}

/**
 * Con strict:false el narrowing de uniones discriminadas no es fiable,
 * así que usamos una sola forma con error opcional.
 */
export type JoinCoupleResult = { ok: boolean; error?: string };

export async function joinCoupleByCode(
    code: string,
    uid: string,
    displayName: string,
    genre: Genre
): Promise<JoinCoupleResult> {
    const snap = await getDocs(query(collection(db, "couples"), where("code", "==", code)));

    if (snap.empty) {
        return { ok: false, error: "No se encontró ninguna pareja con ese código." };
    }

    const coupleDoc = snap.docs[0];
    const members: string[] = coupleDoc.data().members ?? [];

    // Ya era miembro: solo reactivamos la pareja en su usuario.
    if (!members.includes(uid)) {
        if (members.length >= 2) {
            return { ok: false, error: "Esta pareja ya tiene 2 miembros." };
        }

        await updateDoc(doc(db, "couples", coupleDoc.id), {
            [`displayNames.${uid}`]: displayName,
            [`genres.${uid}`]: genre,
            members: arrayUnion(uid)
        });
    }

    await updateDoc(doc(db, "users", uid), { activeCoupleId: coupleDoc.id });
    return { ok: true };
}

export async function createCouple(params: {
    code: string;
    docId: string;
    title: string;
    uid: string;
    displayName: string;
    genre: Genre;
}): Promise<JoinCoupleResult> {
    const coupleRef = doc(db, "couples", params.docId);

    if ((await getDoc(coupleRef)).exists()) {
        return { ok: false, error: "Ya existe una pareja con ese identificador." };
    }

    const taken = await getDocs(query(collection(db, "couples"), where("code", "==", params.code)));
    if (!taken.empty) {
        return { ok: false, error: "Ese código ya está en uso." };
    }

    await setDoc(coupleRef, {
        code: params.code,
        title: params.title,
        members: [params.uid],
        displayNames: { [params.uid]: params.displayName },
        genres: { [params.uid]: params.genre },
        lastMomentIndex: 0
    });

    await updateDoc(doc(db, "users", params.uid), { activeCoupleId: params.docId });
    return { ok: true };
}

import type { Timestamp } from "firebase/firestore";

/** "15 de enero" */
export function formatDate(timestamp: Timestamp): string {
    return new Date(timestamp.toMillis()).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long"
    });
}

/** "2026 • 4:17 pm" */
export function formatSecondaryDate(timestamp: Timestamp): string {
    const date = timestamp.toDate();

    const year = new Intl.DateTimeFormat("es-PE", { year: "numeric" }).format(date);
    const time = new Intl.DateTimeFormat("es-PE", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    })
        .format(date)
        .toLowerCase();

    return `${year} • ${time}`;
}

/** "15 de enero de 2026 • 4:17 pm" */
export function formatFullDate(timestamp: Timestamp): string {
    const formatted = new Intl.DateTimeFormat("es-PE", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    }).format(timestamp.toDate());

    return formatted.replace(",", " •");
}

/** Date -> valor para <input type="datetime-local"> */
export function toDatetimeLocal(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");

    return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
        `T${pad(date.getHours())}:${pad(date.getMinutes())}`
    );
}

/**
 * Promedio de dos ratings redondeado a medias estrellas.
 * Si solo hay uno, ese vale. Si no hay ninguno, null.
 */
export function averageRating(a: number | null, b: number | null): number | null {
    const values = [a, b].filter((v): v is number => typeof v === "number");
    if (values.length === 0) return null;

    const average = values.reduce((sum, v) => sum + v, 0) / values.length;
    return Math.round(average * 2) / 2;
}

/**
 * Elección estable a partir de una semilla.
 *
 * El código original llamaba a randInt() en cada render para los fondos y
 * avatares. En React eso haría que cambiaran solos en cada re-render, así que
 * los derivamos del momentId: mismo momento -> misma imagen, siempre.
 */
export function pickIndex(seed: number, count: number): number {
    return (Math.abs(seed) % count) + 1;
}

/** Fondo de slide: back1..back5 */
export function backgroundFor(seed: number): string {
    return `/assets/img/back${pickIndex(seed, 5)}.jpg`;
}

/** Avatar de un miembro: {name}1..{name}N */
export function avatarFor(name: string, seed: number, variants: number): string {
    return `/assets/img/avatars/${name}${pickIndex(seed, variants)}.jpg`;
}

export const AVATAR_VARIANTS: Record<string, number> = {
    jose: 4,
    mar: 4
};

export function avatarVariantsFor(name: string): number {
    return AVATAR_VARIANTS[name.toLowerCase()] ?? 1;
}

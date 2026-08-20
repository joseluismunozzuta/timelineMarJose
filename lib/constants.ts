export const SPOTIFY_SEARCH_URL =
    "https://us-central1-marlove-9b442.cloudfunctions.net/spotifySearch";

/** Momentos por bloque: cada bloque es un Swiper independiente. */
export const MOMENTS_PER_BLOCK = 5;

export const FEELINGS_MAN = [
    "Feliz 😄",
    "Enamorado ❤️",
    "Orgulloso 😌",
    "Agradecido 🙏",
    "Emocionado 🤩",
    "Tranquilo 😌",
    "Nervioso 😅",
    "Sorprendido 😲",
    "Melancólico 🥹"
];

export const FEELINGS_WOMAN = [
    "Feliz 😊",
    "Enamorada ❤️",
    "Agradecida 🙏",
    "Emocionada 🤩",
    "Tranquila 😌",
    "Nerviosa 😅",
    "Ilusionada ✨",
    "Sorprendida 😲",
    "Melancólica 🥹"
];

export function feelingsFor(genre: string | null | undefined): string[] {
    return genre === "man" ? FEELINGS_MAN : FEELINGS_WOMAN;
}

/** Fotos de los momentos históricos, agrupadas por carpeta = visualIndex - 1. */
export const LEGACY_IMAGE_URLS = [
    "/assets/img/0/IMG-20260115-WA0177.jpg",
    "/assets/img/1/IMG-20260118-WA0106.jpg",
    "/assets/img/1/IMG-20260118-WA0024.jpg",
    "/assets/img/1/IMG-20260118-WA0108.jpg",
    "/assets/img/10/IMG_9024.gif",
    "/assets/img/11/20260211_211913.jpg",
    "/assets/img/11/9fed7cd7-a7c1-4938-b3b2-0c54d1becfaa-copied-media~2.jpg",
    "/assets/img/11/IMG_9087.jpg",
    "/assets/img/11/IMG_9091.jpg",
    "/assets/img/11/IMG_9094.jpg",
    "/assets/img/11/IMG_9099.jpg",
    "/assets/img/12/20260214_230711.jpg",
    "/assets/img/12/IMG_9246.jpg",
    "/assets/img/12/IMGMar.jpg",
    "/assets/img/12/IMG_9265.jpg",
    "/assets/img/13/IMG_9355.jpg",
    "/assets/img/14/20260221_031519.jpg",
    "/assets/img/15/20260222.jpg",
    "/assets/img/15/20260222_171437.jpg",
    "/assets/img/15/20260222_17230.gif",
    "/assets/img/16/100IMG_9508.gif",
    "/assets/img/16/1120260224_203551.jpg",
    "/assets/img/16/12IMG_9497.webp",
    "/assets/img/17/IMG_9639.webp",
    "/assets/img/18/IMG_9655.webp",
    "/assets/img/19/158ca60ba-0361-14008.jpg",
    "/assets/img/19/5IMG_9741.gif",
    "/assets/img/19/200020260303_2116.jpg",
    "/assets/img/2/IMG_8480.jpg",
    "/assets/img/2/20260122_224946.jpg",
    "/assets/img/21/20260307_214814.webp",
    "/assets/img/21/IMG_9835.webp",
    "/assets/img/22/20260310_22400.jpg",
    "/assets/img/23/1IMG-20260314-WA0001.webp",
    "/assets/img/23/IMG_9967.webp",
    "/assets/img/3/20260125_110053.jpg",
    "/assets/img/3/20260124_183549.jpg",
    "/assets/img/3/20260125_002820.jpg",
    "/assets/img/4/IMG_85822.gif",
    "/assets/img/4/IMG_8573.jpg",
    "/assets/img/5/IMG-20260129-WA0022.jpg",
    "/assets/img/5/IMG_8639.jpg",
    "/assets/img/6/20260130_194929.jpg",
    "/assets/img/7/IMG_8882.gif",
    "/assets/img/8/IMG_8961.jpg",
    "/assets/img/9/IMG_8966.gif"
];

/**
 * Fotos del carousel de un momento histórico (fase 1).
 *
 * Se resuelve por visualIndex, que es posicional, y eso es seguro por un
 * invariante del proyecto: los momentos de fase 1 están en orden cronológico
 * y ningún momento nuevo puede ser anterior a ellos. Por tanto ocupan siempre
 * las posiciones 1..N y su visualIndex nunca se desplaza.
 *
 * Los momentos nuevos SÍ pueden intercalarse entre ellos, pero esos no usan
 * carousel (llevan urlImg de Storage), así que el desplazamiento no les afecta.
 */
export function legacyImagesFor(visualIndex: number): string[] {
    return LEGACY_IMAGE_URLS.filter((url) => url.startsWith(`/assets/img/${visualIndex - 1}/`));
}

/**
 * Estilo compartido de los modales.
 *
 * Vive en un solo archivo a propósito: son tres modales con la misma superficie
 * y, cuando cada uno llevaba sus clases copiadas, acabaron divergiendo.
 *
 * La superficie es malva profundo translúcido con desenfoque, para que la foto
 * del momento se siga intuyendo detrás y el texto blanco tenga contraste real.
 */

/** Hoja inferior en móvil, tarjeta centrada a partir de sm. */
export const SHEET_DIALOG = "modal-bottom sm:modal-middle";

/** Superficie del modal. Falta el ancho máximo: lo pone cada modal. */
export const SHEET_BOX =
    "max-h-[88vh] w-full p-0 flex flex-col overflow-hidden " +
    "bg-[#241d2b]/90 backdrop-blur-xl border border-white/10 text-white";

/** Cabecera fija: se mantiene visible aunque el cuerpo se desplace. */
export const SHEET_HEADER =
    "shrink-0 border-b border-white/15 px-5 py-3 flex items-center gap-3";

/** Lo único que hace scroll. min-h-0 es lo que permite encogerlo dentro del flex. */
export const SHEET_BODY = "min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-5";

/** Pie fijo con las acciones. */
export const SHEET_FOOTER = "shrink-0 border-t border-white/15 px-5 py-3";

/** Barrita de arrastre, solo en la hoja de móvil. */
export const SHEET_GRABBER = "mx-auto h-1 w-10 rounded-full bg-white/25 sm:hidden";

// --- Controles de formulario sobre fondo oscuro -----------------------------
// Los input/select de daisyUI se pintan según el tema, no según el fondo de su
// contenedor, así que sobre esta superficie se verían claros y desentonarían.

export const SHEET_FIELD =
    "w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white " +
    "placeholder:text-white/40 focus:border-white/45 focus:outline-none transition-colors";

/** Los <option> heredan el fondo del sistema; hay que forzarlo. */
export const SHEET_OPTION = "bg-[#241d2b] text-white";

export const SHEET_LABEL = "mb-1.5 block text-[11px] uppercase tracking-widest text-white/55";

export const SHEET_BUTTON_GHOST =
    "rounded-full px-4 py-2 text-sm text-white/70 hover:text-white transition-colors";

export const SHEET_BUTTON_PRIMARY =
    "rounded-full bg-pink-600 px-5 py-2 text-sm font-semibold text-white " +
    "transition-colors hover:bg-pink-500 disabled:opacity-40 disabled:hover:bg-pink-600";

export const SHEET_BUTTON_SOFT =
    "rounded-full border border-white/25 bg-white/10 px-2 py-2 text-xs font-semibold text-white " +
    "transition-colors hover:bg-white/20 disabled:opacity-40";

"use client";

const MAX_VISIBLE_HEARTS = 6;

type Props = {
    value: number;
    onChange: (value: number) => void;
};

export default function IntimacyPicker({ value, onChange }: Props) {
    const visibleHearts = Math.min(value, MAX_VISIBLE_HEARTS);

    return (
        <div className="form-control">
            <span className="mb-1.5 block text-[11px] uppercase tracking-widest text-white/55">Intimidad</span>

            <div className="flex justify-center items-center gap-4">
                <button
                    type="button"
                    className="grid h-9 w-9 place-items-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/10"
                    onClick={() => onChange(Math.max(0, value - 1))}
                >
                    -
                </button>

                <div className="text-center min-w-[90px]">
                    <div className="text-2xl flex justify-center gap-1">
                        {value === 0
                            ? "💤"
                            : Array.from({ length: visibleHearts }, (_, i) => (
                                  // El último late al añadirse; la key incluye el
                                  // total para que React lo remonte y reinicie la animación.
                                  <span
                                      key={`${i}-${value}`}
                                      className={i === visibleHearts - 1 ? "heart-pop" : ""}
                                  >
                                      ❤️
                                  </span>
                              ))}
                    </div>
                    <div className="text-sm text-white/60">
                        {value === 0 ? "Sin intimidad" : `x${value}`}
                    </div>
                </div>

                <button
                    type="button"
                    className="grid h-9 w-9 place-items-center rounded-full bg-pink-600 text-white transition-colors hover:bg-pink-500"
                    onClick={() => onChange(value + 1)}
                >
                    +
                </button>
            </div>
        </div>
    );
}

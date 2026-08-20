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
            <span className="label-text font-medium mb-2">Intimidad</span>

            <div className="flex justify-center items-center gap-4">
                <button
                    type="button"
                    className="btn btn-circle btn-outline"
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
                    <div className="text-sm opacity-70">
                        {value === 0 ? "Sin intimidad" : `x${value}`}
                    </div>
                </div>

                <button
                    type="button"
                    className="btn btn-circle btn-primary"
                    onClick={() => onChange(value + 1)}
                >
                    +
                </button>
            </div>
        </div>
    );
}

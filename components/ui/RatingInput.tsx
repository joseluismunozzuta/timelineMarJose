"use client";

const HALF_STAR_VALUES = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

type Props = {
    name: string;
    value: number | null;
    /** Sin onChange, las estrellas son de solo lectura. */
    onChange?: (value: number) => void;
};

/** Estrellas en medias de daisyUI. Editable si recibe onChange. */
export default function RatingInput({ name, value, onChange }: Props) {
    const readOnly = !onChange;

    return (
        <div className="rating rating-sm rating-half mx-auto">
            <input
                type="radio"
                name={name}
                className="rating-hidden hidden"
                checked={value == null || value === 0}
                disabled={readOnly}
                readOnly={readOnly}
                onChange={() => onChange?.(0)}
            />
            {HALF_STAR_VALUES.map((starValue, i) => (
                <input
                    key={starValue}
                    type="radio"
                    name={name}
                    value={starValue}
                    className={`mask mask-star-2 ${i % 2 === 0 ? "mask-half-1" : "mask-half-2"} bg-orange-400`}
                    checked={value === starValue}
                    disabled={readOnly}
                    readOnly={readOnly}
                    onChange={() => onChange?.(starValue)}
                />
            ))}
        </div>
    );
}

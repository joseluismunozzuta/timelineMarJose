const HALF_STAR_VALUES = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

/** Estrellas de solo lectura, en medias. value null = sin valorar. */
export default function Rating({ name, value }: { name: string; value: number | null }) {
    return (
        <div className="rating rating-sm rating-half">
            <input
                type="radio"
                name={name}
                className="rating-hidden"
                checked={value == null}
                disabled
                readOnly
            />
            {HALF_STAR_VALUES.map((starValue, i) => (
                <input
                    key={starValue}
                    type="radio"
                    name={name}
                    value={starValue}
                    className={`mask mask-star-2 ${i % 2 === 0 ? "mask-half-1" : "mask-half-2"} bg-orange-400`}
                    checked={value === starValue}
                    disabled
                    readOnly
                />
            ))}
        </div>
    );
}

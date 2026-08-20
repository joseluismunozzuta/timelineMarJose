const HEART_PATH =
    "M93.9,46.4c9.3,9.5,13.8,17.9,23.5,17.9s17.5-7.8,17.5-17.5s-7.8-17.6-17.5-17.5c-9.7,0.1-13.3,7.2-22.1,17.1 c-8.9,8.8-15.7,17.9-25.4,17.9s-17.5-7.8-17.5-17.5s7.8-17.5,17.5-17.5S86.2,38.6,93.9,46.4z";

export default function Loader({ show }: { show: boolean }) {
    if (!show) return null;

    return (
        <div className="h-screen w-screen place-items-center grid bg-white/75 backdrop-filter backdrop-blur-lg backdrop-opacity-75 fixed top-0 right-0 z-5000 justify-center items-center">
            <svg
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                preserveAspectRatio="xMidYMid meet"
                viewBox="0 0 187.3 93.7"
                height="300px"
                width="400px"
            >
                <path
                    d={HEART_PATH}
                    id="outline"
                    stroke="#FF0000"
                    strokeMiterlimit={10}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeWidth={4}
                    fill="none"
                />
                <path
                    d={HEART_PATH}
                    id="outline-bg"
                    stroke="#FF0000"
                    strokeMiterlimit={10}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeWidth={4}
                    fill="none"
                    opacity={0.05}
                />
            </svg>
        </div>
    );
}

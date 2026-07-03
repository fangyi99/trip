const SCRAPS = [
  { top: "12%", left: "8%", size: 26, rotate: -12, delay: "0s" },
  { top: "68%", left: "14%", size: 18, rotate: 20, delay: "1.2s" },
  { top: "30%", left: "84%", size: 22, rotate: 8, delay: "0.6s" },
  { top: "75%", left: "80%", size: 30, rotate: -18, delay: "1.8s" },
  { top: "48%", left: "6%", size: 14, rotate: 30, delay: "2.4s" },
];

/** Small drifting paper-plane shapes that fill the desk around the book on desktop. */
export default function Backdrop() {
  return (
    <div
      className="hidden lg:block fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {SCRAPS.map((s, i) => (
        <svg
          key={i}
          className="drift absolute text-gold/25"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
            "--r": `${s.rotate}deg`,
            transform: `rotate(${s.rotate}deg)`,
          }}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" />
        </svg>
      ))}
    </div>
  );
}

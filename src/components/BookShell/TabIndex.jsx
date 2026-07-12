import { NavLink } from "react-router-dom";

const CHAPTERS = [
  { path: "/journey", label: "Journey" },
  { path: "/sights", label: "Sights" },
  { path: "/stay", label: "Stay" },
  { path: "/plan", label: "Plan" },
];

export default function TabIndex() {
  return (
    <nav
      aria-label="Trip chapters"
      className="paper-texture flex flex-col items-end justify-start gap-2 pt-4 pr-0 shrink-0"
    >
      {CHAPTERS.map(({ path, label }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            [
              "tab-pennant flex items-center justify-center h-24 sm:h-28 transition-all",
              isActive
                ? "bg-gold text-cover-dark w-10 sm:w-11 shadow-inner"
                : "bg-cover-dark/90 text-paper/70 w-8 sm:w-9 hover:text-paper",
            ].join(" ")
          }
        >
          <span className="[writing-mode:vertical-rl] [text-orientation:mixed] text-xs tracking-widest uppercase font-mono pl-1">
            {label}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}

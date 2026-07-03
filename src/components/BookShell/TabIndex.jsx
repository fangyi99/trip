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
      className="flex flex-col justify-start gap-2 pt-4 pl-1 shrink-0 bg-paper-shadow/40"
    >
      {CHAPTERS.map(({ path, label }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            [
              "tab-notch flex items-center justify-center h-24 sm:h-28 transition-all",
              isActive
                ? "bg-gold text-cover-dark w-9 sm:w-10 shadow-inner"
                : "bg-cover-dark/90 text-paper/70 w-7 sm:w-8 hover:text-paper",
            ].join(" ")
          }
        >
          <span className="[writing-mode:vertical-rl] [text-orientation:mixed] text-xs tracking-widest uppercase font-mono">
            {label}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}

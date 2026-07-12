import { AnimatePresence, motion } from "framer-motion";
import { useLocation, Outlet } from "react-router-dom";
import TabIndex from "./TabIndex.jsx";
import Backdrop from "./Backdrop.jsx";
import { useMediaQuery } from "../../hooks/useMediaQuery.js";

// Desktop view: floating card + backdrop animation + page-turn transition
// Mobile view: full-bleed
export default function BookShell() {
  const location = useLocation();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  return (
    <div className="h-screen lg:min-h-screen lg:h-auto overflow-hidden lg:overflow-y-auto flex items-center justify-center lg:px-6 lg:py-10">
      <Backdrop />

      <div className="relative w-full h-full lg:h-[min(85vh,760px)] lg:min-h-[560px] lg:max-w-[430px] flex flex-col">
        <div className="hidden lg:block absolute -left-2 top-3 bottom-3 w-2 rounded-l-md bg-cover-dark" />

        <div className="relative bg-paper lg:rounded-r-2xl lg:rounded-l-sm lg:shadow-book overflow-hidden flex-1 flex flex-col">
          <header className="bg-cover text-paper px-6 pt-6 pb-4 shrink-0">
            <h1 className="font-mono text-xl tracking-[0.3em] uppercase text-gold">
              Wayfarer
            </h1>
          </header>

          <div className="flex-1 flex overflow-hidden">
            <main className="paper-texture px-6 py-6 flex-1 overflow-hidden flex flex-col">
              {isDesktop ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="h-full"
                  >
                    <Outlet />
                  </motion.div>
                </AnimatePresence>
              ) : (
                <Outlet />
              )}
            </main>

            <TabIndex />
          </div>
        </div>
      </div>
    </div>
  );
}

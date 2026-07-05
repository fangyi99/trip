import { Navigate, Route, Routes } from "react-router-dom";
import BookShell from "./components/BookShell/BookShell.jsx";
import JourneyPage from "./pages/JourneyPage.jsx";
import SightsPage from "./pages/SightsPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<BookShell />}>
        <Route index element={<Navigate to="/journey" replace />} />
        <Route path="/journey" element={<JourneyPage />} />
        <Route path="/sights" element={<SightsPage />} />
      </Route>
    </Routes>
  );
}

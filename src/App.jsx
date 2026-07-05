import { Navigate, Route, Routes } from "react-router-dom";
import BookShell from "./components/BookShell/BookShell.jsx";
import JourneyPage from "./pages/JourneyPage.jsx";
import SightsPage from "./pages/SightsPage.jsx";
import StayPage from "./pages/StayPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<BookShell />}>
        <Route index element={<Navigate to="/journey" replace />} />
        <Route path="/journey" element={<JourneyPage />} />
        <Route path="/sights" element={<SightsPage />} />
        <Route path="/stay" element={<StayPage />} />
      </Route>
    </Routes>
  );
}

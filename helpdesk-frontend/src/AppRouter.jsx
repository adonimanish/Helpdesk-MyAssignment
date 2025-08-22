import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import KBList from "./pages/KBListPage";
import TicketList from "./pages/TicketListPage";
import TicketDetail from "./pages/TicketDetailPage";
import Settings from "./pages/SettingsPage";

const AppRouter = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/kb" element={<KBList />} />
      <Route path="/tickets" element={<TicketList />} />
      <Route path="/tickets/:id" element={<TicketDetail />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  </Router>
);

export default AppRouter;

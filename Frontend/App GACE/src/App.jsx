import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RequirePermission from "./components/RequirePermission";
import AdminLayout from "./components/AdminLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Entreprises from "./pages/Entreprises";
import Visites from "./pages/Visites";
import Rapports from "./pages/Rapports";
import Infractions from "./pages/Infractions";
import Documents from "./pages/Documents";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={<ProtectedRoute />}>
            <Route index element={<Navigate to="/dashboard" replace />} />

            <Route path="dashboard" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />

              {/* Each permission below mirrors the backend controller's middleware exactly. */}
              <Route
                element={<RequirePermission permission="voir-utilisateurs" />}
              >
                <Route path="users" element={<Users />} />
              </Route>

              <Route
                element={<RequirePermission permission="voir-entreprises" />}
              >
                <Route path="entreprises" element={<Entreprises />} />
              </Route>

              <Route
                element={<RequirePermission permission="voir-inspections" />}
              >
                <Route path="visites" element={<Visites />} />
              </Route>

              <Route element={<RequirePermission permission="voir-rapports" />}>
                <Route path="rapports" element={<Rapports />} />
              </Route>

              <Route
                element={<RequirePermission permission="voir-nonconformites" />}
              >
                <Route path="infractions" element={<Infractions />} />
              </Route>

              <Route
                element={<RequirePermission permission="voir-documents" />}
              >
                <Route path="documents" element={<Documents />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

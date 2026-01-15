import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import Locations from "./pages/Locations";
import Ingredients from "./pages/Ingredients";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/register" element={<Register />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/ingredients" element={<Ingredients />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

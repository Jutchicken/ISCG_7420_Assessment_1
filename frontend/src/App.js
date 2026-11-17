import logo from './logo.svg';
import './App.css';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import 'bootstrap/dist/css/bootstrap.min.css'
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Container from 'react-bootstrap/Container';
import 'bootstrap/dist/css/bootstrap.min.css'
import Home from "./pages/Home";
import Login from "./components/Login";
import PatientAppointments from "./pages/PatientAppointments";
import BookAppointment from "./pages/BookAppointment";
import Register from "./pages/Register";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminPatientManagement from "./pages/AdminPatientManagement";
import AdminDoctorManagement from "./pages/AdminDoctorManagement";
import AdminDepartmentManagement from "./pages/AdminDepartmentManagement";
import AdminAvailabilityManagement from "./pages/AdminAvailabilityManagement";

function App() {
  return (
    <BrowserRouter>
      <Navbar bg="light" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/">
            Piki Ora Medical Centre
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="main-navbar" />

          <Navbar.Collapse id="main-navbar">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/">Home</Nav.Link>
              <Nav.Link as={Link} to="/my-appointments">My Appointments</Nav.Link>
              <Nav.Link as={Link} to="/book-appointment">Book Appointment</Nav.Link>
              <Nav.Link as={Link} to="/admin/doctors">Doctor Management</Nav.Link>
              <Nav.Link as={Link} to="/admin/departments">Department Management</Nav.Link>
              <Nav.Link as={Link} to="/admin/availability">Availability Management</Nav.Link>
              <Nav.Link as={Link} to="/login">Login</Nav.Link>
              <Nav.Link as={Link} to="/register">Register</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/my-appointments" element={<PatientAppointments />} />
        <Route path="/book-appointment" element={<BookAppointment />} />
        <Route path="/register" element={<Register />} />
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
        <Route path="/admin/patients" element={<AdminPatientManagement />} />
        <Route path="/admin/doctors" element={<AdminDoctorManagement />} />
        <Route path="/admin/departments" element={<AdminDepartmentManagement />} />
        <Route path="/admin/availability" element={<AdminAvailabilityManagement />}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

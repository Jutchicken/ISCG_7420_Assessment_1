import logo from './logo.svg';
import './App.css';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import 'bootstrap/dist/css/bootstrap.min.css'
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import Container from 'react-bootstrap/Container';
import 'bootstrap/dist/css/bootstrap.min.css'
import api from "./api/client";

import Home from "./pages/Home";
import Login from "./components/Login";
import Register from "./components/Register";

import PatientAppointments from "./pages/Patient/PatientAppointments";
import BookAppointment from "./pages/Patient/BookAppointment";
import EditAppointment from "./pages/Patient/EditAppointment";


import DoctorDashboard from "./pages/Doctor/DoctorDashboard";

import AdminPatientManagement from "./pages/Admin/AdminPatientManagement";
import AdminDoctorManagement from "./pages/Admin/AdminDoctorManagement";
import AdminDepartmentManagement from "./pages/Admin/AdminDepartmentManagement";
import AdminAvailabilityManagement from "./pages/Admin/AdminAvailabilityManagement";
import AdminAppointmentManagement from "./pages/Admin/AdminAppointmentManagement";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/Admin/AdminDashboard";

function NavigationBar() {
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        let active = true;

        async function checkRole() {
            const token = localStorage.getItem("token");

            if (!token) {
                if (active) {
                    setRole(null);
                    setLoading(false);
                }
                return;
            }

            try {
                const response = await api.get("me/");
                const user = response.data;

                if (!active) return;

                if (user.is_staff || user.is_superuser) {
                    setRole("Admin");
                }
                else if (user.is_doctor) {
                    setRole("Doctor");
                }
                else {
                    setRole("Patient");
                }
            }
            catch (error) {
                if (active) {
                    setRole(null);
                }
            }
            finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        setLoading(true);
        checkRole();

        return () => {active = false;};
    }, [location.pathname]);

    async function handleLogout() {
        try {
            await api.post("logout/");
        }
        catch (error) {
            console.error("Logout request failed.");
        }
        finally {
            localStorage.removeItem("token");
            setRole(null);
            window.location.href = "/login";
        }
    }

    return (
        <Navbar bg="light" expand="lg">
            <Container>
                <Navbar.Brand as={Link} to="/">Piki Ora Medical Centre</Navbar.Brand>
                <Navbar.Toggle aria-controls="main-navbar" />
                <Navbar.Collapse id="main-navbar">
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to="/">Home</Nav.Link>

                        {!loading && role === "Patient" && (<>
                                <Nav.Link as={Link} to="/my-appointments">My Appointments</Nav.Link>
                                <Nav.Link as={Link} to="/book-appointment">Book Appointment</Nav.Link>
                            </>
                        )}

                        {!loading && role === "Doctor" && (
                            <Nav.Link as={Link} to="/doctor-dashboard">Doctor Dashboard</Nav.Link>
                        )}

                        {!loading && role === "Admin" && (
                            <Nav.Link as={Link} to="/admin/dashboard">Admin Dashboard</Nav.Link>
                        )}
                    </Nav>

                    {!loading && (
                        <Nav>
                            {role ? (<Nav.Link onClick={handleLogout}>Logout</Nav.Link>) : (
                                <>
                                    <Nav.Link as={Link} to="/login">Login</Nav.Link>
                                    <Nav.Link as={Link} to="/register">Register</Nav.Link>
                                </>
                            )}
                        </Nav>
                    )}
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

function App() {
  return (
    <BrowserRouter>
      <NavigationBar />
      <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/my-appointments" element={<ProtectedRoute allowedRoles={["Patient"]}><PatientAppointments /></ProtectedRoute>} />
          <Route path="/book-appointment" element={<ProtectedRoute allowedRoles={["Patient"]}><BookAppointment /></ProtectedRoute>} />
          <Route path="/edit-appointment/:id" element={<ProtectedRoute allowedRoles={["Patient"]}><EditAppointment /></ProtectedRoute>} />

          <Route path="/doctor-dashboard" element={<ProtectedRoute allowedRoles={["Doctor"]}><DoctorDashboard /></ProtectedRoute>} />

          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["Admin"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/patients" element={<ProtectedRoute allowedRoles={["Admin"]}><AdminPatientManagement /></ProtectedRoute>} />
          <Route path="/admin/doctors" element={<ProtectedRoute allowedRoles={["Admin"]}><AdminDoctorManagement /></ProtectedRoute>} />
          <Route path="/admin/departments" element={<ProtectedRoute allowedRoles={["Admin"]}><AdminDepartmentManagement /></ProtectedRoute>} />
          <Route path="/admin/availability" element={<ProtectedRoute allowedRoles={["Admin"]}><AdminAvailabilityManagement /></ProtectedRoute>} />
          <Route path="/admin/appointments" element={<ProtectedRoute allowedRoles={["Admin"]}><AdminAppointmentManagement /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import api from "../api/client";

function ProtectedRoute({ children, allowedRoles }) {
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const location = useLocation();

    useEffect(() => {
        let active = true;

        async function checkUser() {
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

                let userRole = "Patient";
                if (user.is_staff || user.is_superuser) {
                    userRole = "Admin";
                }
                else if (user.is_doctor) {
                    userRole = "Doctor";
                }
                if (active) {
                    setRole(userRole);
                }
            }
            catch (err) {
                if (active) {
                    if (err.response?.status === 401) {
                        localStorage.removeItem("token");
                        setRole(null);
                    }
                    else {
                        setError("Unable to verify your account.");
                    }
                }
            }
            finally {
                if (active) {
                    setLoading(false);
                }
            }
        }
        checkUser();
        return () => {
            active = false;
        };
    }, [location.pathname]);

    if (loading) {
        return (
            <div className="container py-4">
                <p>Checking authentication...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container py-4">
                <div className="alert alert-danger">{error}</div>
                <button className="btn btn-outline-primary" onClick={() => window.location.reload()}>
                    Retry
                </button>
            </div>
        );
    }

    if (!role) {
        return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(role)) {
        if (role === "Admin") {
            return <Navigate to="/admin/dashboard" replace />;
        }
        if (role === "Doctor") {
            return <Navigate to="/doctor-dashboard" replace />;
        }
        return <Navigate to="/my-appointments" replace />;
    }
    return children;
}

export default ProtectedRoute;

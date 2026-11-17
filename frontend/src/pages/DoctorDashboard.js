import React, { useEffect, useState } from "react";
import api from "../api/client";

function DoctorDashboard() {
    const [appointments, setAppointments] = useState([]);
    const [activeTab, setActiveTab] = useState("upcoming");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadAppointments() {
            try {
                const response = await api.get("appointments/");

                const data = Array.isArray(response.data)
                    ? response.data
                    : response.data.results || [];

                setAppointments(data);
            }
            catch (err) {
                setError(
                    err.response?.data?.detail ||
                    "Failed to load appointments."
                );
            }
            finally {
                setLoading(false);
            }
        }
        loadAppointments();
    }, []);

    const now = new Date();

    const getAppointmentDate = (appointment) => {
        return new Date(
            `${appointment.appointment_date}T${appointment.appointment_time}`
        );
    };

    const getStatus = (appointment) => (appointment.status_name || "Unknown").toLowerCase();

    const upcoming = appointments.filter((appointment) => {
        const status = getStatus(appointment);

        return (
            getAppointmentDate(appointment) >= now &&
            ["pending", "approved"].includes(status)
        );
    });

    const history = appointments.filter((appointment) => {
        const status = getStatus(appointment);

        return (
            getAppointmentDate(appointment) < now ||
            ["finished", "canceled"].includes(status)
        );
    });

    const displayedAppointments =
        activeTab === "upcoming"
            ? upcoming
            : activeTab === "history"
            ? history
            : appointments;

    const getBadgeColor = (status) => {
        switch (status) {
            case "approved":
                return "bg-success";
            case "pending":
                return "bg-warning text-dark";
            case "finished":
                return "bg-secondary";
            case "canceled":
                return "bg-danger";
            default:
                return "bg-primary";
        }
    };

    return (
        <div className="container py-4">
            <h2 className="mb-4">Doctor Dashboard</h2>

            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            <div className="row mb-4">
                <div className="col-md-4 mb-3">
                    <div className="card">
                        <div className="card-body">
                            <h6>Total Appointments</h6>
                            <h3>{appointments.length}</h3>
                        </div>
                    </div>
                </div>

                <div className="col-md-4 mb-3">
                    <div className="card">
                        <div className="card-body">
                            <h6>Upcoming Appointments</h6>
                            <h3>{upcoming.length}</h3>
                        </div>
                    </div>
                </div>

                <div className="col-md-4 mb-3">
                    <div className="card">
                        <div className="card-body">
                            <h6>Appointment History</h6>
                            <h3>{history.length}</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="btn-group mb-4">
                <button
                    className={`btn ${
                        activeTab === "upcoming"
                            ? "btn-primary"
                            : "btn-outline-primary"
                    }`}
                    onClick={() => setActiveTab("upcoming")}>
                    Upcoming
                </button>

                <button
                    className={`btn ${
                        activeTab === "history"
                            ? "btn-primary"
                            : "btn-outline-primary"
                    }`}
                    onClick={() => setActiveTab("history")}>
                    History
                </button>

                <button
                    className={`btn ${
                        activeTab === "all"
                            ? "btn-primary"
                            : "btn-outline-primary"
                    }`}
                    onClick={() => setActiveTab("all")}>
                    All Appointments
                </button>
            </div>

            {loading ? (
                <p>Loading appointments...</p>
            ) : displayedAppointments.length === 0 ? (
                <div className="alert alert-info">
                    No appointments found.
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-striped align-middle">
                        <thead>
                            <tr>
                                <th>Patient</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Department</th>
                                <th>Details</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {displayedAppointments.map((appointment) => {
                                const status = getStatus(appointment);

                                return (
                                    <tr key={appointment.id}>
                                        <td>{appointment.patient_name}</td>
                                        <td>{appointment.appointment_date}</td>
                                        <td>{appointment.appointment_time}</td>
                                        <td>{appointment.department_name}</td>
                                        <td>{appointment.appointment_details}</td>
                                        <td>
                                            <span className={`badge ${getBadgeColor(status)}`}>
                                                {appointment.status_name}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default DoctorDashboard;

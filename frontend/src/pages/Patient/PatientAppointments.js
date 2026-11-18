import React, { useEffect, useState } from "react";
import api from "../../api/client";
import { useLocation, useNavigate } from "react-router-dom";

function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const location = useLocation();
  const bookingMessage = location.state?.message;
  const navigate = useNavigate();

  const loadAppointments = async () => {
    try {
      setError("");
      const response = await api.get("appointments/");
      const data = response.data;

      setAppointments(Array.isArray(data) ? data : data.results || []);
    }
    catch (err) {
      setError(err.response?.data?.detail || "Failed to load appointments.");
    }
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {loadAppointments();}, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this appointment?")) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await api.delete(`appointments/${id}/`);

      setMessage("Appointment canceled successfully.");
      await loadAppointments();
    }
    catch (err) {
      const data = err.response?.data;

      setError(
        data?.error ||
          data?.detail ||
          data?.status ||
          "Failed to cancel appointment."
      );
    }
  };

  const getStatus = (appointment) => {
    return appointment.status_name || "Unknown";
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">My Appointments</h2>

      {bookingMessage && (<div className="alert alert-success">{bookingMessage}</div>)}
      {message && (<div className="alert alert-success">{message}</div>)}
      {error && (<div className="alert alert-danger">{error}</div>)}

      {loading ? (<p>Loading appointments...</p>) : appointments.length === 0 ? (
          <div className="alert alert-info">You have no appointments.</div>
      ) : (
          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead>
              <tr>
                <th>Doctor</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Details</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {appointments.map((appointment) => {
                const appointmentStatus = getStatus(appointment).toLowerCase();
                const canCancel = ["pending", "approved"].includes(appointmentStatus);
                const canEdit = ["pending", "approved"].includes(appointmentStatus);

                return (
                  <tr key={appointment.id}>
                    <td>{appointment.doctor_name || appointment.doctor}</td>
                    <td>{appointment.appointment_date}</td>
                    <td>{appointment.appointment_time}</td>
                    <td>{getStatus(appointment)}</td>
                    <td>{appointment.appointment_details}</td>
                    <td>
                      {canEdit && (
                        <button className="btn btn-warning btn-sm me-2" onClick={() => navigate(`/edit-appointment/${appointment.id}`)}>
                          Edit
                        </button>
                      )}
                      
                      {canCancel && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleCancel(appointment.id)}>
                          Cancel
                        </button>
                      )}
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

export default PatientAppointments;

import React, { useEffect, useState } from "react";
import api from "../../api/client";

function AdminAppointmentManagement() {
    const [appointments, setAppointments] = useState([]);
    const [slots, setSlots] = useState([]);
    const [editing, setEditing] = useState(null);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const toList = (data) => Array.isArray(data) ? data : data?.results || [];

    const getError = (err) => {
        const data = err.response?.data;

        if (!data) {
            return "Request failed. Please try again.";
        }

        if (typeof data === "string") {
            return data;
        }

        return Object.entries(data)
            .map(([key, value]) => {
                const text = Array.isArray(value)
                    ? value.join(", ")
                    : typeof value === "string"
                    ? value
                    : JSON.stringify(value);

                return `${key}: ${text}`;
            }).join(" | ");
    };

    const loadData = async () => {
        try {
            const [appointmentResponse, slotResponse] =
                await Promise.all([api.get("appointments/"), api.get("slots/")]);

            setAppointments(toList(appointmentResponse.data));
            setSlots(toList(slotResponse.data));
        }
        catch (err) {
            setError(getError(err));
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {loadData();}, []);

    const getStatus = (appointment) => (appointment.status_name || "Unknown").toLowerCase();

    const getBadgeColor = (status) => {
        switch (status) {
            case "pending":
                return "bg-warning text-dark";
            case "approved":
                return "bg-success";
            case "finished":
                return "bg-secondary";
            case "canceled":
                return "bg-danger";
            default:
                return "bg-primary";
        }
    };

    const filteredAppointments = appointments.filter((appointment) => filter === "all" || getStatus(appointment) === filter);
    const canEdit = (appointment) => ["pending", "approved"].includes(getStatus(appointment));

    const handleEdit = (appointment) => {
        setEditing({
            id: appointment.id,
            slot: appointment.slot ? String(appointment.slot) : "",
            appointment_details: appointment.appointment_details || ""
        });

        setError("");
        setMessage("");
    };

    const availableSlots = slots.filter((slot) => slot.is_available || String(slot.id) === String(editing?.slot));

    const handleSave = async (e) => {
        e.preventDefault();

        if (!editing) return;

        setSaving(true);
        setError("");
        setMessage("");

        try {
            const original = appointments.find(item => item.id === editing.id);
            const payload = {appointment_details: editing.appointment_details};
            const selectedSlot = editing.slot ? Number(editing.slot) : null;

            if (selectedSlot !== null && selectedSlot !== original?.slot) {
                payload.slot = selectedSlot;
            }

            await api.patch(`appointments/${editing.id}/`, payload);

            setMessage("Appointment updated successfully.");
            setEditing(null);
            await loadData();
        }
        catch (err) {
            setError(getError(err));
        }
        finally {
            setSaving(false);
        }
    };

    const handleCancel = async (appointment) => {
        if (!window.confirm(`Cancel appointment #${appointment.id} for ${appointment.patient_name}?`)) {
            return;
        }

        setError("");
        setMessage("");

        try {
            await api.delete(`appointments/${appointment.id}/`);
            setMessage("Appointment canceled successfully.");
            await loadData();
        }
        catch (err) {
            setError(getError(err));
        }
    };

    return (
        <div className="container py-4">
            <h2 className="mb-4">Appointment Management</h2>

            {error && (<div className="alert alert-danger">{error}</div>)}
            {message && (<div className="alert alert-success">{message}</div>)}

            {editing && (
                <div className="card mb-4">
                    <div className="card-body">
                        <h4 className="mb-3">Edit Appointment #{editing.id}</h4>

                        <form onSubmit={handleSave}>
                            <div className="mb-3">
                                <label className="form-label">Doctor / Date / Time</label>

                                <select className="form-select" value={editing.slot}
                                    onChange={(e) =>
                                        setEditing({...editing, slot: e.target.value})}>
                                    <option value="">Keep current appointment time</option>

                                    {availableSlots.map((slot) => (
                                        <option key={slot.id} value={slot.id}>
                                            {slot.doctor_name || `Doctor ${slot.doctor}`}
                                            {" | "}
                                            {slot.date}
                                            {" | "}
                                            {slot.start_time.slice(0, 5)}
                                            {" - "}
                                            {slot.end_time.slice(0, 5)}
                                        </option>
                                    ))}
                                </select>

                                <small className="text-muted">Select an available slot to reschedule.</small>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Appointment Details</label>

                                <textarea className="form-control" rows="4" value={editing.appointment_details}
                                    onChange={(e) =>
                                        setEditing({...editing, appointment_details: e.target.value})}
                                />
                            </div>

                            <div className="d-flex gap-2">
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>

                                <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>
                                    Cancel Edit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>All Appointments</h4>

                <select className="form-select w-auto" value={filter}
                    onChange={(e) => setFilter(e.target.value)}>
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="finished">Finished</option>
                    <option value="canceled">Canceled</option>
                </select>
            </div>

            {loading ? (<p>Loading appointments...</p>) : (
                <div className="table-responsive">
                    <table className="table table-striped align-middle">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Patient</th>
                                <th>Doctor</th>
                                <th>Department</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredAppointments.map(
                                (appointment) => {
                                    const status = getStatus(appointment);
                                    return (
                                        <tr key={appointment.id}>
                                            <td>{appointment.id}</td>
                                            <td>{appointment.patient_name}</td>
                                            <td>{appointment.doctor_name}</td>
                                            <td>{appointment.department_name}</td>
                                            <td>{appointment.appointment_date}</td>
                                            <td>{appointment.appointment_time}</td>
                                            <td>
                                                <span className={`badge ${getBadgeColor(status)}`}>
                                                    {appointment.status_name}
                                                </span>
                                            </td>

                                            <td>
                                                {canEdit(appointment) && (
                                                    <div className="d-flex gap-2">
                                                        <button className="btn btn-outline-primary btn-sm"
                                                            onClick={() => handleEdit(appointment)}>
                                                            Edit
                                                        </button>

                                                        <button className="btn btn-outline-danger btn-sm"
                                                            onClick={() => handleCancel(appointment)}>
                                                            Cancel
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                }
                            )}

                            {filteredAppointments.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="text-center">No appointments found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default AdminAppointmentManagement;

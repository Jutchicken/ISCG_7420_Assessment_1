import React, { useEffect, useState } from "react";
import api from "../../api/client";

const emptyForm = {
    doctor: "",
    date: "",
    start_time: "",
    end_time: "",
    is_available: true
};

function AdminAvailabilityManagement() {
    const [doctors, setDoctors] = useState([]);
    const [slots, setSlots] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const toList = (data) => Array.isArray(data) ? data : data.results || [];

    const getError = (err) => {
        const data = err.response?.data;

        if (!data) return "Request failed.";
        if (typeof data === "string") return data;

        return Object.entries(data)
            .map(([key, value]) =>
                `${key}: ${Array.isArray(value)
                    ? value.join(", ")
                    : String(value)}`
            ).join(" | ");
    };

    const loadData = async () => {
        try {
            const [doctorResponse, slotResponse] =
                await Promise.all([api.get("admin/doctors/"), api.get("slots/")]);

            setDoctors(toList(doctorResponse.data));
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

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setForm(previous => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const resetForm = () => {setEditingId(null);setForm({ ...emptyForm });};

    const handleEdit = (slot) => {
        setEditingId(slot.id);

        setForm({
            doctor: String(slot.doctor),
            date: slot.date,
            start_time: slot.start_time.slice(0, 5),
            end_time: slot.end_time.slice(0, 5),
            is_available: slot.is_available
        });

        setError("");
        setMessage("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setMessage("");

        try {
            const payload = {
                doctor: Number(form.doctor),
                date: form.date,
                start_time: form.start_time,
                end_time: form.end_time,
                is_available: form.is_available
            };

            if (editingId !== null) {
                await api.patch(`slots/${editingId}/`, payload);
                setMessage("Availability updated successfully.");
            }
            else {
                await api.post("slots/", payload);setMessage("Appointment slot created successfully.");
            }

            resetForm();
            await loadData();
        }
        catch (err) {
            setError(getError(err));
        }
        finally {
            setSaving(false);
        }
    };

    const handleToggle = async (slot) => {
        setError("");
        setMessage("");

        try {
            await api.patch(`slots/${slot.id}/`, {is_available: !slot.is_available});
            setMessage("Availability changed successfully.");
            await loadData();
        }
        catch (err) {
            setError(getError(err));
        }
    };

    const handleDelete = async (slot) => {
        if (!window.confirm("Delete this appointment slot?")) {
            return;
        }

        setError("");
        setMessage("");

        try {
            await api.delete(`slots/${slot.id}/`);
            setMessage("Slot deleted successfully.");
            await loadData();
        }
        catch (err) {
            setError(getError(err));
        }
    };

    const getDoctorName = (doctorId) => {
        const doctor = doctors.find(item => String(item.id) === String(doctorId));
        if (!doctor) return `Doctor ${doctorId}`;

        return `${doctor.first_name} ${doctor.last_name}`.trim() || doctor.username;
    };

    return (
        <div className="container py-4">
            <h2 className="mb-4">Availability Management</h2>
            {error && (<div className="alert alert-danger">{error}</div>)}
            {message && (<div className="alert alert-success">{message}</div>)}

            <div className="card mb-4">
                <div className="card-body">
                    <h4 className="mb-3">
                        {editingId !== null ? "Edit Appointment Slot" : "Add Appointment Slot"}
                    </h4>

                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Doctor</label>

                                <select className="form-select" name="doctor" value={form.doctor}
                                    onChange={handleChange} required>
                                    <option value="">Select Doctor</option>

                                    {doctors.map(doctor => (
                                        <option key={doctor.id} value={doctor.id}>
                                            {doctor.first_name}{" "}
                                            {doctor.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">Date</label>
                                <input type="date" className="form-control" name="date" value={form.date}
                                    onChange={handleChange} required/>
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">Start Time</label>
                                <input type="time" className="form-control" name="start_time" value={form.start_time}
                                    onChange={handleChange} required/>
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">End Time</label>
                                <input type="time" className="form-control" name="end_time" value={form.end_time}
                                    onChange={handleChange} required/>
                            </div>
                        </div>

                        <div className="form-check mb-3">
                            <input type="checkbox" className="form-check-input" id="slotAvailability" name="is_available"
                                checked={form.is_available} onChange={handleChange}/>

                            <label className="form-check-label" htmlFor="slotAvailability">Available for booking</label>
                        </div>

                        <div className="d-flex gap-2">
                            <button type="submit" className="btn btn-primary" disabled={saving || doctors.length === 0}>
                                {saving ? "Saving..." : editingId !== null ? "Save Changes" : "Add Slot"}
                            </button>

                            {editingId !== null && (
                                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            <h4 className="mb-3">Appointment Slots</h4>

            {loading ? (
                <p>Loading appointment slots...</p>
            ) : (
                <div className="table-responsive">
                    <table className="table table-striped align-middle">
                        <thead>
                            <tr>
                                <th>Doctor</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Availability</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {slots.map(slot => (
                                <tr key={slot.id}>
                                    <td>{getDoctorName(slot.doctor)}</td>
                                    <td>{slot.date}</td>
                                    <td>
                                        {slot.start_time.slice(0, 5)}
                                        {" - "}
                                        {slot.end_time.slice(0, 5)}
                                    </td>

                                    <td>
                                        <span className={`badge ${slot.is_available ? "bg-success" : "bg-secondary"}`}>
                                            {slot.is_available ? "Available" : "Unavailable"}
                                        </span>
                                    </td>

                                    <td>
                                        <div className="d-flex gap-2 flex-wrap">
                                            <button className="btn btn-outline-primary btn-sm"
                                                onClick={() => handleEdit(slot)}>
                                                Edit
                                            </button>

                                            <button className="btn btn-outline-warning btn-sm"
                                                onClick={() => handleToggle(slot)}>
                                                {slot.is_available ? "Make Unavailable" : "Make Available"}
                                            </button>

                                            <button className="btn btn-outline-danger btn-sm"
                                                onClick={() => handleDelete(slot)}>
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {slots.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center">
                                        No appointment slots found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default AdminAvailabilityManagement;

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/client";

function EditAppointment() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [appointment, setAppointment] = useState(null);
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState("");
    const [details, setDetails] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadData() {
            try {
                const [appointmentResponse, slotsResponse] =
                    await Promise.all([api.get(`appointments/${id}/`), api.get("slots/")]);

                const current = appointmentResponse.data;

                setAppointment(current);
                setDetails(current.appointment_details || "");

                const availableSlots = slotsResponse.data;
                setSlots(
                    Array.isArray(availableSlots)
                        ? availableSlots
                        : availableSlots.results || []
                );
            }
            catch (err) {
                setError("Failed to load appointment information.");
            }
            finally {
                setLoading(false);
            }
        }
        loadData();
    }, [id]);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (!selectedSlot && details === (appointment.appointment_details || "")) {
            setError("Please change the appointment time or details.");
            return;
        }

        setSaving(true);

        try {
            const data = {
                appointment_details: details
            };

            if (selectedSlot) {
                data.slot = Number(selectedSlot);
            }

            await api.patch(`appointments/${id}/`, data);

            navigate("/my-appointments", {
                state: {message: "Appointment updated successfully."}
            });
        }
        catch (err) {
            const data = err.response?.data;

            setError(
                data?.slot?.[0] ||
                data?.appointment_details?.[0] ||
                data?.status?.[0] ||
                data?.detail ||
                data?.error ||
                "Failed to update appointment."
            );
        }
        finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <div className="container mt-5">Loading...</div>;
    }

    if (error && !appointment) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger">{error}</div>
                <button className="btn btn-secondary" onClick={() => navigate("/my-appointments")}>
                    Back
                </button>
            </div>
        );
    }

    const status = (appointment.status_name || "").toLowerCase();
    const canEdit = ["pending", "approved"].includes(status);

    return (
        <div className="container mt-5">
            <h2>Edit Appointment</h2>
            <div className="card mt-4">
                <div className="card-body">
                    <h5>Current Appointment</h5>
                    <p><strong>Doctor:</strong> {appointment.doctor_name}</p>
                    <p><strong>Department:</strong> {appointment.department_name}</p>
                    <p><strong>Date:</strong> {appointment.appointment_date}</p>
                    <p><strong>Time:</strong> {appointment.appointment_time}</p>
                    <p><strong>Status:</strong> {appointment.status_name}</p>
                </div>
            </div>

            {error && (<div className="alert alert-danger mt-3">{error}</div>)}

            {!canEdit ? (
                <div className="alert alert-warning mt-3">
                    This appointment cannot be edited.
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="mt-4">
                    <div className="mb-3">
                        <label className="form-label">Change Appointment Time</label>

                        <select className="form-select" value={selectedSlot}
                            onChange={(e) => setSelectedSlot(e.target.value)}>
                            <option value="">
                                Keep current appointment time
                            </option>

                            {slots.map((slot) => (
                                <option key={slot.id} value={slot.id}>
                                    {slot.doctor_name} |
                                    {" "}{slot.date} |
                                    {" "}{slot.start_time} - {slot.end_time}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Appointment Details</label>

                        <textarea className="form-control" rows="4" value={details}
                            onChange={(e) => setDetails(e.target.value)}/>
                    </div>

                    <button type="submit" className="btn btn-primary me-2" disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                    </button>

                    <button type="button" className="btn btn-secondary" onClick={() => navigate("/my-appointments")}>
                        Cancel
                    </button>
                </form>
            )}
        </div>
    );
}

export default EditAppointment;

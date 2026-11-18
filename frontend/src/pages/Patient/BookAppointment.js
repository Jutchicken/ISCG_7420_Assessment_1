import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";

function BookAppointment() {
    const navigate = useNavigate();

    const [slots, setSlots] = useState([]);
    const [doctorId, setDoctorId] = useState("");
    const [slotId, setSlotId] = useState("");
    const [details, setDetails] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    async function loadSlots() {
        setLoading(true);
        try {
            const response = await api.get("slots/");

            const data = Array.isArray(response.data)
                ? response.data
                : response.data.results || [];

            setSlots(data.filter(slot => slot.is_available === true));
        }
        catch (err) {
            setError(
                err.response?.data?.detail ||
                "Failed to load available appointments."
            );
        }
        finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!localStorage.getItem("token")) {
            navigate("/login", { replace: true });
            return;
        }

        loadSlots();
    }, [navigate]);

    const doctors = Array.from(
        new Map(
            slots.map(slot => [
                String(slot.doctor),
                {
                    id: String(slot.doctor),
                    name: slot.doctor_name ||
                        'Doctor ${slot.doctor}'
                }
            ])
        ).values()
    );

    const filteredSlots = slots
        .filter(slot => String(slot.doctor) === doctorId)
        .sort((a, b) => {
            const dateA = `${a.date} ${a.start_time}`;
            const dateB = `${b.date} ${b.start_time}`;

            return dateA.localeCompare(dateB);
        });

    async function handleBooking(event) {
        event.preventDefault();

        if (!slotId) {
            setError("Please select an appointment time.");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            await api.post("appointments/", {
                slot: Number(slotId),
                appointment_details: details
            });

            navigate("/my-appointments", {
                state: {message: "Appointment booked successfully!"}
            });
        } catch (err) {
            const data = err.response?.data;

            const rawError =
                data?.slot ||
                data?.error ||
                data?.detail ||
                data?.non_field_errors ||
                "Failed to book appointment.";

            const errorMessage = Array.isArray(rawError) ? rawError.join(" ")
                : typeof rawError === "string"
                    ? rawError : "Failed to book appointment.";

            setError(errorMessage);

            try {
                const response = await api.get("slots/");
                const updated = Array.isArray(response.data)
                    ? response.data
                    : response.data.results || [];

                setSlots(
                    updated.filter(
                        slot => slot.is_available === true
                    )
                );
                setSlotId("");
            }
            catch {
            }
        }
        finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="container py-4">
                <p>Loading appointments...</p>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <h2 className="mb-4">Book an Appointment</h2>

            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            {doctors.length === 0 ? (
                <div className="alert alert-info">
                    No available appointment slots.
                </div>
            ) : (
                <form onSubmit={handleBooking}>
                    <div className="mb-3">
                        <label className="form-label">Select Doctor</label>

                        <select className="form-select" value={doctorId}
                            onChange={e => {
                                setDoctorId(e.target.value);
                                setSlotId("");
                            }} required>
                            <option value="">Choose a Doctor</option>

                            {doctors.map(doctor => (
                                <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Available Date and Time</label>

                        <select className="form-select" value={slotId}
                            onChange={e => setSlotId(e.target.value)}
                            disabled={!doctorId} required>
                            <option value="">Choose an available time</option>

                            {filteredSlots.map(slot => (
                                <option key={slot.id} value={slot.id}>
                                    {slot.date} |{" "}
                                    {slot.start_time} - {slot.end_time}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Appointment Details</label>

                        <textarea className="form-control" rows="4" value={details}
                            onChange={e => setDetails(e.target.value)}
                            placeholder="Describe your reason for visiting"/>
                    </div>

                    <button className="btn btn-primary" type="submit" disabled={!slotId || submitting}>
                        {submitting ? "Booking..." : "Confirm Appointment"}
                    </button>
                </form>
            )}
        </div>
    );
}

export default BookAppointment;

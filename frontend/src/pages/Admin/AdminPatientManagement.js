import React, { useEffect, useState } from "react";
import api from "../../api/client";

function AdminPatientManagement() {
    const [patients, setPatients] = useState([]);
    const [selected, setSelected] = useState(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    const loadPatients = async () => {
        try {
            const response = await api.get("admin/patients/");
            const data = response.data;

            setPatients(Array.isArray(data) ? data : data.results || []);
        }
        catch (err) {
            setError(err.response?.data?.detail || "Failed to load patients.");
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {loadPatients();}, []);

    const handleEdit = (patient) => {
        setError("");
        setMessage("");
        setSelected({ ...patient });
    };

    const handleSave = async (e) => {
        e.preventDefault();

        try {
            setError("");

            await api.patch(
                `admin/patients/${selected.id}/`,
                {
                    first_name: selected.first_name,
                    last_name: selected.last_name,
                    email: selected.email,
                    is_active: selected.is_active
                }
            );

            setMessage("Patient updated successfully.");
            setSelected(null);
            await loadPatients();
        }
        catch (err) {
            const data = err.response?.data;
            setError(data?.detail || JSON.stringify(data || "Update failed."));
        }
    };

    const handleDisable = async (patient) => {
        if (!window.confirm(
            `Disable patient "${patient.username}"?`
        )) {
            return;
        }

        try {
            setError("");
            await api.delete(`admin/patients/${patient.id}/`);
            setMessage("Patient account disabled.");
            await loadPatients();
        }
        catch (err) {
            setError(err.response?.data?.detail || "Failed to disable patient.");
        }
    };

    const handleReactivate = async (patient) => {
        try {
            setError("");
            await api.patch(`admin/patients/${patient.id}/`, { is_active: true });
            setMessage("Patient account reactivated.");
            await loadPatients();
        }
        catch (err) {
            setError(err.response?.data?.detail || "Failed to reactivate patient.");
        }
    };

    return (
        <div className="container py-4">
            <h2 className="mb-4">Patient Management</h2>

            {error && (
                <div className="alert alert-danger">{error}</div>
            )}

            {message && (
                <div className="alert alert-success">{message}</div>
            )}

            {selected && (
                <form className="card card-body mb-4" onSubmit={handleSave}>
                    <h4>Edit Patient: {selected.username}</h4>

                    {["first_name", "last_name", "email"].map(
                        (field) => (
                            <div className="mb-3" key={field}>
                                <label className="form-label">
                                    {field.replace("_", " ")}
                                </label>

                                <input className="form-control"
                                    type={field === "email" ? "email" : "text"}
                                    value={selected[field] || ""}
                                    onChange={(e) =>
                                        setSelected({
                                            ...selected,
                                            [field]: e.target.value
                                        })
                                    }
                                />
                            </div>
                        )
                    )}

                    <div className="d-flex gap-2">
                        <button className="btn btn-primary">Save Changes</button>

                        <button type="button" className="btn btn-secondary" onClick={() => setSelected(null)}>
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {loading ? (<p>Loading patients...</p>) : (
                <div className="table-responsive">
                    <table className="table table-striped align-middle">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {patients.map((patient) => (
                                <tr key={patient.id}>
                                    <td>{patient.username}</td>

                                    <td>
                                        {patient.first_name}{" "}
                                        {patient.last_name}
                                    </td>

                                    <td>{patient.email}</td>

                                    <td>
                                        <span
                                            className={`badge ${patient.is_active ? "bg-success" : "bg-secondary"}`}>
                                            {patient.is_active ? "Active" : "Disabled"}
                                        </span>
                                    </td>

                                    <td>
                                        <div className="d-flex gap-2">
                                            <button className="btn btn-outline-primary btn-sm"
                                                    onClick={() => handleEdit(patient)}>
                                                Edit
                                            </button>

                                            {patient.is_active ? (
                                                <button className="btn btn-outline-danger btn-sm"
                                                    onClick={() => handleDisable(patient)}>
                                                    Disable
                                                </button>
                                            ) : (
                                                <button className="btn btn-outline-success btn-sm"
                                                    onClick={() => handleReactivate(patient)}>
                                                    Reactivate
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {patients.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center">
                                        No patients found.
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

export default AdminPatientManagement;

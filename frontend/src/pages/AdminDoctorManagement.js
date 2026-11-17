import React, { useEffect, useState } from "react";
import api from "../api/client";

const emptyForm = {
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    department: ""
};

function AdminDoctorManagement() {
    const [doctors, setDoctors] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

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
                    : String(value);

                return `${key}: ${text}`;
            }).join(" | ");
    };

    const loadData = async () => {
        try {
            setError("");

            const [doctorResponse, departmentResponse] =
                await Promise.all([
                    api.get("admin/doctors/"),
                    api.get("departments/")
                ]);

            const doctorData = doctorResponse.data;
            const departmentData = departmentResponse.data;

            setDoctors(
                Array.isArray(doctorData)
                    ? doctorData
                    : doctorData.results || []
            );

            setDepartments(
                Array.isArray(departmentData)
                    ? departmentData
                    : departmentData.results || []
            );
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
        setForm({...form, [e.target.name]: e.target.value});
    };

    const handleEdit = (doctor) => {
        setEditingId(doctor.id);

        setForm({
            username: doctor.username || "",
            first_name: doctor.first_name || "",
            last_name: doctor.last_name || "",
            email: doctor.email || "",
            password: "",
            department: doctor.department
                ? String(doctor.department)
                : ""
        });

        setError("");
        setMessage("");
    };

    const resetForm = () => {
        setEditingId(null);
        setForm({ ...emptyForm });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setSaving(true);
        setError("");
        setMessage("");

        try {
            const payload = {
                username: form.username,
                first_name: form.first_name,
                last_name: form.last_name,
                email: form.email,
                department: Number(form.department)
            };

            if (form.password) {
                payload.password = form.password;
            }

            if (editingId) {
                await api.patch(`admin/doctors/${editingId}/`, payload);
                setMessage("Doctor updated successfully.");
            }
            else {
                await api.post("admin/doctors/", payload);
                setMessage("Doctor created successfully.");
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

    const handleDelete = async (doctor) => {
        if (!window.confirm(
            `Delete doctor "${doctor.username}"?`
        )) {
            return;
        }

        setError("");
        setMessage("");

        try {
            await api.delete(`admin/doctors/${doctor.id}/`);
            setMessage("Doctor removed successfully.");
            await loadData();
        }
        catch (err) {
            setError(getError(err));
        }
    };

    return (
        <div className="container py-4">
            <h2 className="mb-4">Doctor Management</h2>

            {error && (
                <div className="alert alert-danger">{error}</div>
            )}

            {message && (
                <div className="alert alert-success">{message}</div>
            )}

            <div className="card mb-4">
                <div className="card-body">
                    <h4 className="mb-3">
                        {editingId ? "Edit Doctor" : "Add Doctor"}
                    </h4>

                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Username</label>

                                <input className="form-control" name="username" value={form.username}
                                    onChange={handleChange} required/>
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">Password</label>

                                <input type="password" className="form-control" name="password" value={form.password}
                                    onChange={handleChange} required={!editingId}
                                    placeholder={editingId ?
                                        "Leave blank to keep current password" : "Enter initial password"}/>
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">First Name</label>

                                <input className="form-control" name="first_name" value={form.first_name}
                                    onChange={handleChange} required/>
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">Last Name</label>

                                <input className="form-control" name="last_name" value={form.last_name}
                                    onChange={handleChange} required/>
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">Email</label>

                                <input type="email" className="form-control" name="email" value={form.email}
                                    onChange={handleChange} required/>
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">Department</label>

                                <select className="form-select" name="department" value={form.department}
                                    onChange={handleChange} required>

                                    <option value="">Select Department</option>

                                    {departments.map((department) => (
                                        <option key={department.id} value={department.id}>
                                            {department.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {departments.length === 0 && (
                            <div className="alert alert-warning">
                                No departments found. Add a department
                                before creating a doctor.
                            </div>
                        )}

                        <div className="d-flex gap-2">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={
                                    saving ||
                                    departments.length === 0
                                }
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId
                                    ? "Save Changes"
                                    : "Add Doctor"}
                            </button>

                            {editingId && (
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={resetForm}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            <h4 className="mb-3">Doctor List</h4>

            {loading ? (
                <p>Loading doctors...</p>
            ) : (
                <div className="table-responsive">
                    <table className="table table-striped align-middle">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Department</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {doctors.map((doctor) => (
                                <tr key={doctor.id}>
                                    <td>{doctor.username}</td>

                                    <td>
                                        {doctor.first_name}{" "}
                                        {doctor.last_name}
                                    </td>

                                    <td>{doctor.email}</td>

                                    <td>
                                        {doctor.department_name || "N/A"}
                                    </td>

                                    <td>
                                        <div className="d-flex gap-2">
                                            <button
                                                className="btn btn-outline-primary btn-sm"
                                                onClick={() =>
                                                    handleEdit(doctor)
                                                }
                                            >
                                                Edit
                                            </button>

                                            <button
                                                className="btn btn-outline-danger btn-sm"
                                                onClick={() =>
                                                    handleDelete(doctor)
                                                }
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {doctors.length === 0 && (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className="text-center"
                                    >
                                        No doctors found.
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

export default AdminDoctorManagement;

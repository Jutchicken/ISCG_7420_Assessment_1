import React, { useEffect, useState } from "react";
import api from "../../api/client";

function AdminDepartmentManagement() {
    const [departments, setDepartments] = useState([]);
    const [name, setName] = useState("");
    const [editingId, setEditingId] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const getError = (err) => {
        const data = err.response?.data;
        if (!data) return "Request failed.";
        if (typeof data === "string") return data;

        return Object.entries(data)
            .map(([key, value]) => {
                const text = Array.isArray(value) ? value.join(", ") : String(value);
                return `${key}: ${text}`;
            }).join(" | ");
    };

    const loadDepartments = async () => {
        try {
            const response = await api.get("admin/departments/");
            const data = response.data;

            setDepartments(Array.isArray(data) ? data : data.results || []);
        }
        catch (err) {
            setError(getError(err));
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {loadDepartments();}, []);
    const resetForm = () => {setName("");setEditingId(null);};

    const handleEdit = (department) => {
        setEditingId(department.id);
        setName(department.name);
        setError("");
        setMessage("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            setError("Department name is required.");
            return;
        }

        setSaving(true);
        setError("");
        setMessage("");

        try {
            if (editingId !== null) {
                await api.patch(`admin/departments/${editingId}/`, { name: name.trim() });
                setMessage("Department updated successfully.");
            }
            else {
                await api.post("admin/departments/", { name: name.trim() });
                setMessage("Department added successfully.");
            }

            resetForm();
            await loadDepartments();
        }
        catch (err) {
            setError(getError(err));
        }
        finally {
            setSaving(false);
        }
    };

    const handleDelete = async (department) => {
        if (!window.confirm(
            `Delete department "${department.name}"?`
        )) {
            return;
        }

        setError("");
        setMessage("");

        try {
            await api.delete(`admin/departments/${department.id}/`);
            setMessage("Department deleted successfully.");
            await loadDepartments();
        }
        catch (err) {
            setError(getError(err));
        }
    };

    return (
        <div className="container py-4">
            <h2 className="mb-4">Department Management</h2>
            {error && (<div className="alert alert-danger">{error}</div>)}
            {message && (<div className="alert alert-success">{message}</div>)}

            <div className="card mb-4">
                <div className="card-body">
                    <h4>
                        {editingId !== null ? "Edit Department" : "Add Department"}
                    </h4>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label">Department Name</label>

                            <input className="form-control" value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Cardiology" required/>
                        </div>

                        <div className="d-flex gap-2">
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? "Saving..." : editingId !== null ? "Save Changes" : "Add Department"}
                            </button>

                            {editingId !== null && (
                                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            <h4 className="mb-3">Department List</h4>

            {loading ? (
                <p>Loading departments...</p>
            ) : (
                <div className="table-responsive">
                    <table className="table table-striped align-middle">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Department Name</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {departments.map((department) => (
                                <tr key={department.id}>
                                    <td>{department.id}</td>
                                    <td>{department.name}</td>
                                    <td>
                                        <div className="d-flex gap-2">
                                            <button className="btn btn-outline-primary btn-sm"
                                                onClick={() => handleEdit(department)}>
                                                Edit
                                            </button>

                                            <button className="btn btn-outline-danger btn-sm"
                                                onClick={() => handleDelete(department)}>
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {departments.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="text-center">
                                        No departments found.
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

export default AdminDepartmentManagement;

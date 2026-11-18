
import React from "react";
import { Link } from "react-router-dom";

function AdminDashboard() {
    const managementPages = [
        {
            title: "Patient Management",
            description: "View, edit and deactivate patient accounts.",
            path: "/admin/patients"
        },
        {
            title: "Doctor Management",
            description: "Create doctor accounts, edit profiles and remove doctors.",
            path: "/admin/doctors"
        },
        {
            title: "Department Management",
            description: "Add, edit and delete hospital departments.",
            path: "/admin/departments"
        },
        {
            title: "Availability Management",
            description: "Manage doctor schedules and available appointment slots.",
            path: "/admin/availability"
        },
        {
            title: "Appointment Management",
            description: "View, reschedule and cancel patient appointments.",
            path: "/admin/appointments"
        }
    ];

    return (
        <div className="container py-4">
            <h2 className="mb-2">Admin Dashboard</h2>
            <p className="text-muted mb-4">Piki Ora Medical Centre - Administration</p>
            <div className="row">
                {managementPages.map((page) => (
                    <div className="col-md-6 col-lg-4 mb-4" key={page.path}>
                        <div className="card h-100 shadow-sm">
                            <div className="card-body d-flex flex-column">
                                <h5 className="card-title">{page.title}</h5>
                                <p className="card-text text-muted">{page.description}</p>
                                <Link to={page.path} className="btn btn-primary mt-auto">Open Management</Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default AdminDashboard;

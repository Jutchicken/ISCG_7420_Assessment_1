import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";

function Register() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        username: "",
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        confirm_password: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (form.password !== form.confirm_password) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            await api.post("register/", {
                username: form.username,
                first_name: form.first_name,
                last_name: form.last_name,
                email: form.email,
                password: form.password,
                confirm_password: form.confirm_password
            });

            navigate("/login", {
                state: {message: "Registration successful! Please log in."}
            });
        } catch (err) {
            const data = err.response?.data;

            if (data && typeof data === "object") {
                const errors = Object.entries(data)
                    .map(([field, value]) => {
                        const text = Array.isArray(value)
                            ? value.join(" ")
                            : String(value);

                        return `${field}: ${text}`;
                    });

                setError(errors.join(" | "));
            }
            else {
                setError("Registration failed.");
            }
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-5" style={{ maxWidth: "550px" }}>
            <h2 className="mb-4">Patient Registration</h2>
            {error && (
                <div className="alert alert-danger">{error}</div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Username</label>
                    <input className="form-control" name="username" value={form.username}
                           onChange={handleChange} required/>
                </div>

                <div className="row">
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
                </div>

                <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" name="email" value={form.email}
                        onChange={handleChange} required/>
                </div>

                <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input type="password" className="form-control" name="password" value={form.password}
                        onChange={handleChange} required minLength={8}/>
                </div>

                <div className="mb-3">
                    <label className="form-label">
                        Confirm Password
                    </label>
                    <input type="password" className="form-control" name="confirm_password" value={form.confirm_password}
                        onChange={handleChange} required minLength={8}/>
                </div>

                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                    {loading ? "Registering..." : "Register"}
                </button>
            </form>

            <p className="mt-3 text-center">
                Already have an account?{" "}
                <Link to="/login">Login</Link>
            </p>
        </div>
    );
}

export default Register;

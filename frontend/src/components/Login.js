
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLogin, setIsLogin] = useState(
        Boolean(localStorage.getItem("token"))
    );
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    async function login(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await api.post("login/", {
                username: username,
                password: password
            });

            const token = response.data.token;

            if (!token) {
                setError("Login succeeded but no token was returned.");
                return;
            }

            localStorage.setItem("token", token);
            setIsLogin(true);

            navigate("/my-appointments");

        } catch (error) {
            setError(
                error.response?.data?.detail ||
                error.response?.data?.error ||
                error.response?.data?.non_field_errors?.[0] ||
                "Invalid username or password."
            );
        } finally {
            setLoading(false);
        }
    }

    async function logout() {
        try {
            await api.post("logout/");
        }
        catch (error) {
            console.error("Server logout failed.");
        }
        finally {
            localStorage.removeItem("token");
            setIsLogin(false);
            setUsername("");
            setPassword("");
            navigate("/login");
        }
    }

    if (isLogin) {
        return (
            <div className="container mt-5">
                <h2>Logged In</h2>
                <p>You are currently logged in.</p>
                <button className="btn btn-danger" onClick={logout}>Logout</button>
            </div>
        );
    }

    return (
        <div className="container mt-5">
            <h2>Patient Login</h2>

            {error && (<div className="alert alert-danger">{error}</div>)}

            <form onSubmit={login}>
                <div className="mb-3">
                    <label className="form-label">Username</label>
                    <input type="text" className="form-control" value={username}
                        onChange={(e) =>
                            setUsername(e.target.value)} required/>
                </div>

                <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input type="password" className="form-control" value={password}
                           onChange={(e) =>
                               setPassword(e.target.value)} required/>
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>
        </div>
    );
}

export default Login;

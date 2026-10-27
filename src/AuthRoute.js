import React from "react";
import { Navigate } from "react-router-dom";

export const AuthRoute = ({children}) => {
    const token = localStorage.getItem('token');
    return token ? children: <Navigate to="/login" />
}

export const handleAuthError = (error) => {
    if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        alert("Your session has expired. Please login again.");

        window.location.href = "/login";
    }
};

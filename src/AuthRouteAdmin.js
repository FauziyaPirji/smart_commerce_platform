import React from "react";
import { Navigate } from "react-router-dom";

export const AuthRouteAdmin = ({children}) => {
    const token = localStorage.getItem('adminToken');
    return token ? children: <Navigate to="/admin/login" />
}

export const handleAuthError = (error) => {
    if (error.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        localStorage.removeItem("smartcommerce-admin");

        alert("Your session has expired. Please login again.");

        window.location.href = "/admin/login";
    }
};
import React from "react";
import { Navigate } from "react-router-dom";

export const AuthRouteVendor = ({children}) => {
    const token = localStorage.getItem('vendorToken');
    return token ? children: <Navigate to="/vendor/login" />
}

export const handleAuthError = (error) => {
    if (error.response?.status === 401) {
        localStorage.removeItem("vendorToken");
        localStorage.removeItem("vendorUser");
        localStorage.removeItem("vendorProfile");

        alert("Your session has expired. Please login again.");

        window.location.href = "/vendor/login";
    }
};
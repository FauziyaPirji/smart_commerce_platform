export const getStoredVendor = () => {
    try {
        const savedProfile = localStorage.getItem("vendorProfile");
        const savedUser = localStorage.getItem("vendorUser");
        const token = localStorage.getItem("vendorToken");

        const vendorProfile = savedProfile ? JSON.parse(savedProfile) : null;
        const vendorUser = savedUser ? JSON.parse(savedUser) : null;

        // Extract Vendor Profile ObjectId (_id)
        const vendorId = vendorProfile?._id || vendorProfile?.id || null;

        return {
            token,
            vendorUser,
            vendorProfile,
            vendorId,
            storeName: vendorProfile?.storeName || "Vendor Store",
            storeLogo: vendorProfile?.storeLogo || "",
            email: vendorUser?.email || ""
        };
    } catch (e) {
        console.error("Error reading vendor data from localStorage:", e);
        return {
            token: null,
            vendorUser: null,
            vendorProfile: null,
            vendorId: null,
            storeName: "Vendor Store",
            storeLogo: "",
            email: ""
        };
    }
};
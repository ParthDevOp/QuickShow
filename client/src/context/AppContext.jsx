import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import toast from "react-hot-toast";

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
    
    const { user } = useUser(); // The Clerk Authentication User
    const { getToken } = useAuth();

    // --- State ---
    const [userLocation, setUserLocation] = useState(() => {
        const saved = localStorage.getItem('quickshow_location');
        return saved ? JSON.parse(saved) : { city: "Select City", lat: null, long: null };
    });
    const [manualCity, setManualCity] = useState(userLocation.city !== "Select City" ? userLocation.city : "");
    const [showLocationModal, setShowLocationModal] = useState(false);
    
    // --- Admin & Role State ---
    const [isAdmin, setIsAdmin] = useState(false);
    // CRITICAL FIX: Added loading state to prevent Admin routing race conditions
    const [isCheckingAdmin, setIsCheckingAdmin] = useState(true); 
    const [dbUser, setDbUser] = useState(null); // Stores the database profile (Role, Theater, Coins)

    // --- Backend Config ---
    const backendUrl = import.meta.env.VITE_BASE_URL || "http://localhost:3000";

    const axiosInstance = axios.create({
        baseURL: backendUrl,
        withCredentials: true,
    });

    // --- Helper Functions ---
    const updateUserLocation = (newLoc) => {
        setUserLocation(newLoc);
        setManualCity(newLoc.city);
        localStorage.setItem('quickshow_location', JSON.stringify(newLoc));
    };

    // --- FETCH DATABASE USER PROFILE ---
    const fetchDbUser = async () => {
        try {
            const token = await getToken();
            if (!token) return;

            const { data } = await axiosInstance.get('/api/user/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                setDbUser(data.user);
            }
        } catch (error) {
            console.error("Failed to fetch DB user:", error);
        }
    };

    // --- ADMIN CHECK FUNCTION ---
    const fetchIsAdmin = async () => {
        try {
            setIsCheckingAdmin(true); // Ensure router waits while checking
            const token = await getToken();
            if (!token) {
                setIsAdmin(false);
                return;
            }

            const { data } = await axiosInstance.get('/api/admin/is-admin', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success && data.isAdmin) {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
        } catch (error) {
            if (error.response && error.response.status === 403) {
                setIsAdmin(false);
            } else {
                console.error("Admin Check Failed:", error);
                setIsAdmin(false);
            }
        } finally {
            setIsCheckingAdmin(false); // Resolve loading state to allow router to proceed
        }
    };

    // --- RUN CHECKS AUTOMATICALLY ON LOGIN ---
    useEffect(() => {
        if (user) {
            fetchIsAdmin();
            fetchDbUser(); 
        } else {
            setIsAdmin(false);
            setIsCheckingAdmin(false); // Immediately resolve if there's no user
            setDbUser(null);
        }
    }, [user]);

    // --- Location Detection ---
    const detectLocation = async () => {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        try {
                            const { data } = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`);
                            
                            let city = "Unknown Location";
                            if (data.results.length > 0) {
                                const addressComponents = data.results[0].address_components;
                                const cityObj = addressComponents.find(c => c.types.includes("locality"));
                                if (cityObj) city = cityObj.long_name;
                            }

                            const newLoc = { city, lat: latitude, long: longitude };
                            updateUserLocation(newLoc);
                            
                            toast.success(`Location detected: ${city}`);
                            resolve(newLoc);
                        } catch (error) {
                            console.error("Geocoding Error:", error);
                            toast.error("Failed to fetch city name");
                            reject(error);
                        }
                    },
                    (error) => {
                        toast.error("Location permission denied");
                        reject(error);
                    }
                );
            } else {
                toast.error("Geolocation not supported");
                reject(new Error("Geolocation not supported"));
            }
        });
    };

    const value = {
        user,          // Clerk User (Avatar, email)
        dbUser,        // Database User (Role, TheaterId, Coins)
        getToken,
        backendUrl,
        axios: axiosInstance,
        userLocation,
        setUserLocation: updateUserLocation, 
        manualCity,
        setManualCity,
        detectLocation,
        showLocationModal,
        setShowLocationModal,
        isAdmin,
        isCheckingAdmin, // EXPORTED TO APP.JSX
        fetchIsAdmin,
        fetchDbUser    
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    return useContext(AppContext);
};

export default AppContextProvider;
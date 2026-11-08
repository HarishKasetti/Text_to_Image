import { createContext, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
    const navigate = useNavigate();
    const isMounted = useRef(true);

    const configuredBackendUrl = import.meta.env.VITE_BACKEND_URL;
    const [backendUrl, setBackendUrl] = useState(
        configuredBackendUrl || (import.meta.env.DEV ? "http://localhost:4000" : "")
    );
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [shLogin, setShLogin] = useState(false);
    const [token, _setToken] = useState(() => localStorage.getItem("token") || null);
    const [credits, setCredits] = useState(0);
    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem("user");
            return savedUser ? JSON.parse(savedUser) : null;
        } catch {
            localStorage.removeItem("user");
            return null;
        }
    });

    const setToken = useCallback((newToken) => {
        _setToken(newToken);
        if (newToken) {
            localStorage.setItem("token", newToken);
            axios.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        } else {
            localStorage.removeItem("token");
            delete axios.defaults.headers.common.Authorization;
        }
    }, []);

    useEffect(() => {
        if (token) axios.defaults.headers.common.Authorization = `Bearer ${token}`;
        else delete axios.defaults.headers.common.Authorization;
    }, [token]);

    const clearAuthData = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        delete axios.defaults.headers.common.Authorization;
        if (isMounted.current) {
            _setToken(null);
            setUser(null);
            setCredits(0);
        }
    }, []);

    const loadUserData = useCallback(async (tokenOverride = null) => {
        const effectiveToken = tokenOverride || token;
        if (!effectiveToken) {
            clearAuthData();
            return;
        }

        try {
            setIsLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${effectiveToken}`,
                    "Content-Type": "application/json"
                }
            };
            const [userResponse, creditsResponse] = await Promise.all([
                axios.get(`${backendUrl}/api/user/me`, config),
                axios.get(`${backendUrl}/api/user/credits`, config)
            ]);

            if (!userResponse.data?.success || !userResponse.data.user) {
                throw new Error("Unable to load your account");
            }

            const updatedUser = {
                ...userResponse.data.user,
                credits: creditsResponse.data?.success
                    ? creditsResponse.data.credits
                    : userResponse.data.user.credits
            };
            if (isMounted.current) {
                setUser(updatedUser);
                setCredits(updatedUser.credits);
                localStorage.setItem("user", JSON.stringify(updatedUser));
            }
        } catch (error) {
            console.error("Failed to load user data:", error);
            if (error.response?.status === 401) {
                toast.error("Your session has expired. Please log in again.");
                clearAuthData();
            }
            throw error;
        } finally {
            if (isMounted.current) setIsLoading(false);
        }
    }, [token, backendUrl, clearAuthData]);

    const login = async (email, password) => {
        try {
            setIsAuthenticating(true);
            const { data } = await axios.post(`${backendUrl}/api/user/login`, { email, password });
            if (!data?.success || !data.token) {
                return { success: false, message: data?.message || "Login failed" };
            }
            setToken(data.token);
            await loadUserData(data.token);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || error.message || "An error occurred during login"
            };
        } finally {
            setIsAuthenticating(false);
        }
    };

    const register = async (name, email, password) => {
        try {
            setIsAuthenticating(true);
            const { data } = await axios.post(`${backendUrl}/api/user/register`, { name, email, password });
            if (!data?.success || !data.token) {
                return { success: false, message: data?.message || "Registration failed" };
            }
            setToken(data.token);
            await loadUserData(data.token);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || error.message || "An error occurred during registration",
                errors: error.response?.data?.errors
            };
        } finally {
            setIsAuthenticating(false);
        }
    };

    useEffect(() => {
        isMounted.current = true;
        if (token) loadUserData().catch(() => {});
        return () => { isMounted.current = false; };
    }, []);

    const logout = async (silent = false) => {
        const currentToken = token;
        try {
            if (currentToken) {
                await axios.post(
                    `${backendUrl}/api/user/logout`,
                    {},
                    { headers: { Authorization: `Bearer ${currentToken}` } }
                );
            }
        } catch (error) {
            console.error("Logout API error:", error);
        } finally {
            clearAuthData();
            if (!silent) {
                navigate("/");
                toast.success("Logged out successfully");
            }
        }
    };

    const updateCredits = useCallback((newCredits) => {
        setCredits(newCredits);
        setUser((previousUser) => {
            if (!previousUser) return previousUser;
            const updatedUser = { ...previousUser, credits: newCredits };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            return updatedUser;
        });
    }, []);

    const refreshUserData = useCallback(() => {
        return token ? loadUserData() : Promise.resolve();
    }, [token, loadUserData]);

    const value = {
        user, setUser, token, credits,
        shLogin, setShLogin, isLoading, setIsLoading: setIsLoading,
        isAuthenticating, setToken, login, register, logout,
        loadUserData: refreshUserData,
        backendUrl, setBackendUrl, navigate, setCredits: updateCredits
    };

    return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};

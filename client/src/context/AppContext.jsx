import { createContext, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
    const navigate = useNavigate();
    const isMounted = useRef(true);
    
    // Initialize state
    const [backendUrl, setBackendUrl] = useState(import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000');
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [shLogin, setShLogin] = useState(false);
    const [token, _setToken] = useState(() => localStorage.getItem('token') || null);
    const [credits, setCredits] = useState(0);
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    }, [token]);

    // Set token with localStorage
    const setToken = (newToken) => {
        _setToken(newToken);
        if (newToken) {
            localStorage.setItem('token', newToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        } else {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
        }
    };
    
    // Login function
    const login = async (email, password) => {
        try {
            setIsAuthenticating(true);
            const response = await axios.post(`${backendUrl}/api/user/login`, {
                email,
                password
            });
            
            if (response.data?.success) {
                setToken(response.data.token);
                await loadUserData(response.data.token);
                return { success: true };
            }
            return { success: false, message: response.data?.message || 'Login failed' };
        } catch (error) {
            console.error('Login error:', error);
            return { 
                success: false, 
                message: error.response?.data?.message || 'An error occurred during login' 
            };
        } finally {
            setIsAuthenticating(false);
        }
    };
    
    // Register function
    const register = async (name, email, password) => {
        try {
            setIsAuthenticating(true);
            const response = await axios.post(`${backendUrl}/api/user/register`, {
                name,
                email,
                password
            });
            
            if (response.data?.success) {
                setToken(response.data.token);
                await loadUserData(response.data.token);
                return { success: true };
            }
            return { success: false, message: response.data?.message || 'Registration failed' };
        } catch (error) {
            console.error('Registration error:', error);
            return { 
                success: false, 
                message: error.response?.data?.message || 'An error occurred during registration',
                errors: error.response?.data?.errors
            };
        } finally {
            setIsAuthenticating(false);
        }
    };

    // Clear all auth data
    const clearAuthData = useCallback(() => {
        if (!isMounted.current) return;
        
        console.log('Clearing auth data');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        _setToken(null);
        setUser(null);
        setCredits(0);
    }, []);

    // Load user data and credits
    const loadUserData = useCallback(async (tokenOverride = null) => {
        const effectiveToken = tokenOverride || token;

        if (!effectiveToken) {
            clearAuthData();
            return;
        }

        if (isLoading) {
            console.log('Load already in progress');
            return;
        }

        try {
            setIsLoading(true);
            console.log('Loading user data...');
            
            // Load user profile and credits in parallel
            const [userResponse, creditsResponse] = await Promise.all([
                axios.get(`${backendUrl}/api/user/me`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${effectiveToken}`
                    },
                    validateStatus: () => true
                }),
                axios.get(`${backendUrl}/api/user/credits`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${effectiveToken}`
                    },
                    validateStatus: () => true
                })
            ]);

            const userData = userResponse.data;
            const creditsData = creditsResponse.data;
            
            if (userData?.success && userData.user) {
                console.log('User data loaded:', userData.user);
                const updatedUser = {
                    ...userData.user,
                    credits: creditsData?.success ? creditsData.credits : 0
                };
                
                setUser(updatedUser);
                setCredits(updatedUser.credits);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            } else {
                console.log('Invalid user data received');
                clearAuthData();
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
            if (error.response?.status === 401) {
                toast.error('Your session has expired. Please log in again.');
                clearAuthData();
            }
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
            }
        }
    }, [token, backendUrl, isLoading, clearAuthData]);

    // Initial load
    useEffect(() => {
        isMounted.current = true;
        let timeoutId;
        
        const initialize = () => {
            if (token) {
                loadUserData();
            } else {
                clearAuthData();
            }
        };
        
        // Add a small delay to prevent multiple rapid calls
        timeoutId = setTimeout(initialize, 100);
        
        return () => {
            isMounted.current = false;
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, []); // Empty dependency array - we only want this to run once on mount

    // Logout function
    const logout = async (silent = false) => {
        try {
            if (token) {
                console.log('Attempting to logout');
                await axios.post(`${backendUrl}/api/user/logout`, {}, {
                    headers: { 'Content-Type': 'application/json' },
                    validateStatus: () => true // Don't throw for any status code
                });
            }
        } catch (error) {
            console.error('Logout API error (proceeding with local logout):', error);
        } finally {
            // Always clear local data
            clearAuthData();
            
            if (!silent) {
                navigate('/');
                toast.success('Logged out successfully');
            }
        }
    };

    // Function to update credits
    const updateCredits = useCallback((newCredits) => {
        setCredits(newCredits);
        setUser((prevUser) => {
            if (prevUser) {
                const updatedUser = { ...prevUser, credits: newCredits };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                return updatedUser;
            }
            return prevUser;
        });
    }, []);

    // Refresh user data
    const refreshUserData = useCallback(() => {
        if (token) {
            return loadUserData();
        }
        return Promise.resolve();
    }, [token, loadUserData]);

    const value = {
        // User state
        user,
        setUser,
        token,
        credits,

        // UI state
        shLogin,
        setShLogin,
        isLoading,
        setIsLoading,
        isAuthenticating,

        // Methods
        setToken,
        login,
        register,
        logout,
        loadUserData: refreshUserData,

        // Other
        backendUrl,
        setBackendUrl,
        navigate,
        setCredits: updateCredits
    };

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );
};
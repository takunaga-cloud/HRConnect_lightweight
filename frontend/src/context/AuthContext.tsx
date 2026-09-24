"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/lib/constants";

interface User {
    id?: string;
    username: string;
    email: string;
    role?: string;
    name?: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    loading: boolean;
    backendUrl: string;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    // Token is now HTTP-only cookie, we don't store it in JS state except purely for "isAuthenticated" flag if needed.
    // Actually, we can just rely on 'user' existence.
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchUserProfile = async () => {
        try {
            // Call via Proxy (middleware injects cookie)
            const res = await fetch(`${BACKEND_URL}/api/v1/users/me`);
            if (res.ok) {
                const userData = await res.json();
                setUser(userData);
                return userData;
            } else {
                console.warn(`Profile fetch failed: ${res.status}`);
                setUser(null);
            }
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            setUser(null);
        }
        return null;
    };

    useEffect(() => {
        const initAuth = async () => {
            await fetchUserProfile();
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (username: string, password: string) => // Changed signature
    {
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.detail || "Login failed");
            }

            // After login cookie is set, fetch profile
            const fullUser = await fetchUserProfile();
            if (!fullUser) {
                throw new Error("Failed to fetch user profile after login");
            }
        } catch (error) {
            console.error("Login Context error", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            setUser(null);
            router.push("/login");
        } catch (e) {
            console.error("Logout failed", e);
        }
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated: !!user,
            user,
            loading,
            backendUrl: BACKEND_URL,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

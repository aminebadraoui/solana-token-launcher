'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { AuthService } from './auth';
import { UserProfile, isSupabaseConfigured } from './supabase';

interface UserData {
    walletAddress: string;
    connectedAt: string;
    totalTokensCreated?: number;
    supabaseProfile?: UserProfile;
}

interface UserContextType {
    user: UserData | null;
    supabaseProfile: UserProfile | null;
    isLoading: boolean;
    userTokens: any[];
    refreshUserData: () => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    isSupabaseEnabled: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
    children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
    const { publicKey, connected, disconnect } = useWallet();
    const [user, setUser] = useState<UserData | null>(null);
    const [supabaseProfile, setSupabaseProfile] = useState<UserProfile | null>(null);
    const [userTokens, setUserTokens] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const isSupabaseEnabled = isSupabaseConfigured();

    // Load persisted user data on mount
    useEffect(() => {
        const loadPersistedData = () => {
            try {
                const savedUser = localStorage.getItem('moonrush_user');
                const savedProfile = localStorage.getItem('moonrush_profile');
                const savedTokens = localStorage.getItem('moonrush_tokens');

                if (savedUser) {
                    setUser(JSON.parse(savedUser));
                }
                if (savedProfile) {
                    setSupabaseProfile(JSON.parse(savedProfile));
                }
                if (savedTokens) {
                    setUserTokens(JSON.parse(savedTokens));
                }
            } catch (error) {
                console.error('Error loading persisted user data:', error);
                // Clear corrupted data
                localStorage.removeItem('moonrush_user');
                localStorage.removeItem('moonrush_profile');
                localStorage.removeItem('moonrush_tokens');
            }
        };

        loadPersistedData();
    }, []);

    const refreshUserData = async () => {
        if (!publicKey || !connected) {
            setUser(null);
            setSupabaseProfile(null);
            setUserTokens([]);
            return;
        }

        setIsLoading(true);
        try {
            const walletAddress = publicKey.toString();
            const userData: UserData = {
                walletAddress,
                connectedAt: new Date().toISOString(),
            };

            // Only attempt Supabase authentication if it's configured
            if (isSupabaseEnabled) {
                try {
                    const profile = await AuthService.authenticateWithWallet(walletAddress);
                    if (profile) {
                        setSupabaseProfile(profile);
                        userData.supabaseProfile = profile;
                        userData.totalTokensCreated = profile.total_tokens_created;

                        // Load user tokens
                        const tokens = await AuthService.getUserTokens(profile);
                        setUserTokens(tokens);

                        // Persist Supabase data
                        localStorage.setItem('moonrush_profile', JSON.stringify(profile));
                        localStorage.setItem('moonrush_tokens', JSON.stringify(tokens));
                    }
                } catch (error) {
                    console.error('Supabase authentication error:', error);
                    // Continue without Supabase if there's an error
                }
            } else {
                console.log('Supabase not configured - user will be tracked locally only');
            }

            setUser(userData);

            // Persist user data to localStorage
            localStorage.setItem('moonrush_user', JSON.stringify(userData));
        } catch (error) {
            console.error('Error refreshing user data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        disconnect();
        setUser(null);
        setSupabaseProfile(null);
        setUserTokens([]);

        // Clear persisted data
        localStorage.removeItem('moonrush_user');
        localStorage.removeItem('moonrush_profile');
        localStorage.removeItem('moonrush_tokens');
    };

    // Effect to handle wallet connection changes
    useEffect(() => {
        if (connected && publicKey) {
            refreshUserData();
        } else {
            setUser(null);
            setSupabaseProfile(null);
            setUserTokens([]);

            // Clear persisted data when wallet disconnects
            localStorage.removeItem('moonrush_user');
            localStorage.removeItem('moonrush_profile');
            localStorage.removeItem('moonrush_tokens');
        }
    }, [connected, publicKey?.toString(), isSupabaseEnabled]);

    const contextValue: UserContextType = {
        user,
        supabaseProfile,
        isLoading,
        userTokens,
        refreshUserData,
        logout,
        isAuthenticated: connected && !!publicKey,
        isSupabaseEnabled,
    };

    return (
        <UserContext.Provider value={contextValue}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
} 
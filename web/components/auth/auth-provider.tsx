"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser } from "@/store/services/authService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

type UserRole = "admin" | "moderator" | "user";

type UserData = {
  id: string;
  email: string | null;
  role: UserRole;
  profilePic?: string;
  name?: string;
};

type AuthContextType = {
  userData: UserData | null;
  loading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
};

const AuthContext = createContext<AuthContextType>({
  userData: null,
  loading: true,
  isAdmin: false,
  isModerator: false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.auth);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    if (user && user.token && !user.role) {
      dispatch(getCurrentUser());
    }

    if (user) {
      setUserData({
        id: user._id || "",
        email: user.email || null,
        role: (user.role as UserRole) || "user",
        name: user.name,
        profilePic: user.profilePic,
      });
    } else {
      setUserData(null);
    }
  }, [user, dispatch]);

  const isAdmin = userData?.role === "admin";
  const isModerator = userData?.role === "moderator" || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        userData,
        loading: isLoading,
        isAdmin,
        isModerator,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

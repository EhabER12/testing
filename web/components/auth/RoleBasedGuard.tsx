"use client";

import { useEffect, ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAppSelector } from "@/store/hooks";

interface RoleBasedGuardProps {
  children: ReactNode;
  allowedRoles: ("admin" | "moderator" | "user" | "teacher")[];
  fallbackUrl?: string;
}

export default function RoleBasedGuard({
  children,
  allowedRoles,
  fallbackUrl = "/",
}: RoleBasedGuardProps) {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Check authentication and authorization
    const checkAuth = () => {
      try {
        // Check if user exists and has a role
        if (!user || !user.role) {
          router.push(`${fallbackUrl}?redirect=${window.location.pathname}`);
          return;
        }

        // Check if user's role is in allowed roles
        if (!allowedRoles.includes(user.role as any)) {
          router.push(fallbackUrl);
          return;
        }

        // User is authenticated and authorized
        setIsAuthorized(true);
      } catch (error) {
        console.error("RoleBasedGuard - Auth check error:", error);
        router.push(fallbackUrl);
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, [router, allowedRoles, fallbackUrl, user]);

  // Show loading state while checking authentication
  if (!authChecked) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Render children only if user is authorized
  return isAuthorized ? <>{children}</> : null;
}

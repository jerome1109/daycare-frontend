"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  daycareId: number;
  daycare?: {
    id: number;
    name: string;
  };
  userImage?: string;
}

interface Subscription {
  id: number;
  currentPlan: string;
  planExpiryDate: string;
  enableChatSystem: boolean;
  enableVideoChatSystem: boolean;
  enableParentMobileApp: boolean;
  enableParentWebApp: boolean;
  enableStaffSystem: boolean;
  maxStaffMembers: number;
  enableImageUpload: boolean;
  maxImagesPerUpload: number;
  maxImagesPerDay: number;
  maxImageSizeKB: number;
  imageStorageLimit: number;
  enableVideoUpload: boolean;
  maxVideosPerUpload: number;
  maxVideosPerDay: number;
  maxVideoSizeKB: number;
  videoStorageLimit: number;
  enableAttendanceTracking: boolean;
  enablePaymentSystem: boolean;
  enableActivityTracking: boolean;
  enableMealPlanning: boolean;
  enableHealthRecords: boolean;
  enableEmailNotifications: boolean;
  enablePushNotifications: boolean;
  enableSMSNotifications: boolean;
  apiRequestsPerMinute: number;
  apiRequestsPerDay: number;
  createdAt: string;
  updatedAt: string;
}

interface DaycareRegistrationData {
  daycareName: string;
  address: string;
  phone: string;
  email: string;
  license: string;
  capacity: number;
  operatingHours: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
  firstName: string;
  lastName: string;
  adminEmail: string;
  password: string;
  adminPhone: string;
  selectedPlan: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  subscription: Subscription | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ user: User; token: string }>;
  logout: () => void;
  isLoading: boolean;
  makeAuthenticatedRequest: (
    url: string,
    options?: RequestInit
  ) => Promise<unknown>;
  makeAuthenticatedRequestWithImage: (
    url: string,
    options?: RequestInit
  ) => Promise<unknown>;
  register: (formData: DaycareRegistrationData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (typeof window === "undefined") {
          setIsLoading(false);
          return;
        }

        const savedToken = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");
        const savedSubscription = localStorage.getItem("subscription");

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }

        if (savedSubscription) {
          setSubscription(JSON.parse(savedSubscription));
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      setUser(data.user);
      setToken(data.token);

      if (data.user.daycare?.DaycareSetting) {
        setSubscription(data.user.daycare.DaycareSetting);
        localStorage.setItem(
          "subscription",
          JSON.stringify(data.user.daycare.DaycareSetting)
        );
      }

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setSubscription(null);

    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("subscription");
    }
  }, []);

  const makeAuthenticatedRequest = useCallback(
    async (url: string, options: RequestInit = {}) => {
      try {
        if (!token) {
          logout();
          window.location.href = "/login";
          throw new Error("No authentication token");
        }

        const isAbsoluteUrl =
          url.startsWith("http://") || url.startsWith("https://");
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          // process.env.NEXT_PUBLIC_API_URL_DEV ||
          "http://localhost:5000/api";
        const cleanUrl = url.startsWith("/") ? url : `/${url}`;
        const finalUrl = isAbsoluteUrl ? url : `${baseUrl}${cleanUrl}`;

        const response = await fetch(finalUrl, {
          ...options,
          headers: {
            ...options.headers,
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            logout();
            window.location.href = "/login";
            throw new Error("Session expired");
          }
          const errorData = await response.json();
          throw new Error(errorData.message || "Request failed");
        }

        return await response.json();
      } catch (error) {
        if (
          error instanceof Error &&
          (error.message.includes("Session expired") ||
            error.message.includes("No authentication token"))
        ) {
          logout();
          window.location.href = "/login";
        }
        throw error;
      }
    },
    [token, logout]
  );

  const makeAuthenticatedRequestWithImage = useCallback(
    async (url: string, options: RequestInit = {}) => {
      try {
        if (!token) {
          logout();
          window.location.href = "/login";
          throw new Error("No authentication token");
        }

        const isAbsoluteUrl =
          url.startsWith("http://") || url.startsWith("https://");
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const cleanUrl = url.startsWith("/") ? url : `/${url}`;
        const finalUrl = isAbsoluteUrl ? url : `${baseUrl}${cleanUrl}`;

        // Remove Content-Type header for FormData
        const response = await fetch(finalUrl, {
          ...options,
          headers: {
            Authorization: `Bearer ${token}`,
            // Let the browser set the Content-Type with boundary for FormData
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            logout();
            window.location.href = "/login";
            throw new Error("Session expired");
          }
          const errorData = await response.json();
          throw new Error(errorData.message || "Error uploading file");
        }

        return response;
      } catch (error) {
        if (
          error instanceof Error &&
          (error.message.includes("Session expired") ||
            error.message.includes("No authentication token"))
        ) {
          logout();
          window.location.href = "/login";
        }
        throw error;
      }
    },
    [token, logout]
  );
  // Update the session check effect
  useEffect(() => {
    const checkSession = async () => {
      if (token) {
        try {
          // Use the existing dashboard overview endpoint
          await makeAuthenticatedRequest("/admin/overview");
        } catch (error) {
          // Only logout and redirect if it's an auth error
          if (
            error instanceof Error &&
            (error.message.includes("Session expired") ||
              error.message.includes("No authentication token"))
          ) {
            logout();
            window.location.href = "/login";
          }
          // Ignore other types of errors
          console.log("Session check error:", error);
        }
      }
    };

    // Check session less frequently to reduce server load
    const interval = setInterval(checkSession, 15 * 60 * 1000); // Check every 15 minutes

    return () => clearInterval(interval);
  }, [token, makeAuthenticatedRequest, logout]);

  const register = async (formData: DaycareRegistrationData) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/daycare/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      // Auto-login after successful registration
      await login(formData.adminEmail, formData.password);
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        subscription,
        login,
        logout,
        isLoading,
        makeAuthenticatedRequest,
        makeAuthenticatedRequestWithImage,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

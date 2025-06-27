"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, user, isLoading } = useAuth();
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    if (!isLoading && user) {
      // User is already logged in, redirect based on role
      switch (user.role) {
        case "admin":
        case "super_admin":
          router.push("/admin/dashboard");
          break;
        case "staff":
          router.push("/staff/dashboard");
          break;
        case "user":
          router.push("/parent/dashboard");
          break;
        default:
          router.push("/dashboard");
      }
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await login(email, password);

      // Get user role from the response
      const userRole = response.user.role;

      // Redirect based on user role
      switch (userRole) {
        case "admin":
        case "super_admin":
          router.push("/admin/dashboard");
          break;
        case "staff":
          router.push("/staff/dashboard");
          break;
        case "user":
          router.push("/parent/dashboard");
          break;
        default:
          router.push("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Invalid credentials");
    }
  };

  // If still checking authentication or already logged in, show loading
  if (isLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-lg shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access your account
          </p>
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
            >
              Sign in
            </button>
          </div>

          <div className="flex items-center justify-between pt-4">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-sky-600 hover:text-sky-500"
            >
              Forgot your password?
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium text-sky-600 hover:text-sky-500"
            >
              Register a new daycare
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

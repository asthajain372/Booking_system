import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { login } from "../api/api";
import { LoginForm } from "../types/types"
import { Eye, EyeOff, Lock, Mail, Loader2, AlertCircle } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Check if user is already logged in
  // useEffect(() => {
  //   const token = localStorage.getItem("token");
  //   if (token) {
  //     navigate("/booking");
  //   }
  // }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token && token !== "undefined" && token !== "null") {
      navigate("/booking", { replace: true });
    }
  }, [navigate]);



  const mutation = useMutation({
    mutationFn: (data: LoginForm) => login(data),
    onSuccess: (res: any) => {
      console.log("Login success:", res);

      const token = res?.data?.token;

      if (!token) {
        console.error("Token missing in response", res);
        return;
      }

      localStorage.setItem("token", token);
      navigate("/booking", { replace: true });
    },

    onError: (err: any) => {
      console.error("Login error:", err);
      // Handle specific error cases
      if (err.response?.status === 401) {
        setErrors({
          password: "Invalid credentials. Please try again."
        });
      } else if (err.response?.status === 403) {
        setErrors({
          email: "Please verify your email before logging in."
        });
      } else {
        setErrors({
          password: err.response?.data?.message || "Login failed. Please try again."
        });
      }
    },
  });

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!form.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log("Submitting login:", form);

    if (validateForm()) {
      mutation.mutate(form);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:shadow-2xl">
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800">Welcome Back</h2>
              <p className="text-gray-600 mt-2">Sign in to your account</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className={`pl-10 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none ${errors.email ? "border-red-300 bg-red-50" : "border-gray-300"
                      }`}
                    disabled={mutation.isPending}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className={`pl-10 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none pr-10 ${errors.password ? "border-red-300 bg-red-50" : "border-gray-300"
                      }`}
                    disabled={mutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={mutation.isPending || !form.email || !form.password}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Don't have an account?
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => navigate("/signup")}
                  className="w-full border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:border-blue-500 hover:text-blue-600 transition-all duration-200"
                >
                  Create new account
                </button>
              </div>
            </div>

            {/* Demo credentials */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 mb-2">Demo credentials:</p>
              <div className="text-sm space-y-1">
                <p className="text-gray-600">
                  <span className="font-medium">Email:</span> user@demo.com
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Password:</span> demo123
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
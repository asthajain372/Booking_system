// src/pages/VerifyEmail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/auth/verify/${token}`
        );
        
        if (response.data.success) {
          setStatus("success");
          setMessage("Email verified successfully! You can now log in.");
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate("/login");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(response.data.message || "Verification failed.");
        }
      } catch (error) {
        setStatus("error");
        setMessage(
          error.response?.data?.message || 
          "Verification failed. The link may be expired or invalid."
        );
      }
    };

    if (token) {
      verifyEmail();
    } else {
      setStatus("error");
      setMessage("No verification token provided.");
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full mb-4">
                {status === "verifying" && (
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                )}
                {status === "success" && (
                  <CheckCircle className="h-8 w-8 text-white" />
                )}
                {status === "error" && (
                  <XCircle className="h-8 w-8 text-white" />
                )}
              </div>
              <h2 className="text-3xl font-bold text-gray-800">
                {status === "verifying" && "Verifying Email..."}
                {status === "success" && "Email Verified!"}
                {status === "error" && "Verification Failed"}
              </h2>
            </div>

            <div className="text-center">
              {status === "verifying" && (
                <div className="space-y-4">
                  <p className="text-gray-600">Please wait while we verify your email...</p>
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                </div>
              )}

              {status === "success" && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 font-medium">{message}</p>
                  </div>
                  <p className="text-gray-600">
                    Redirecting to login page in 3 seconds...
                  </p>
                  <button
                    onClick={() => navigate("/login")}
                    className="mt-4 w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-600 hover:to-blue-700 transition-all duration-200"
                  >
                    Go to Login
                  </button>
                </div>
              )}

              {status === "error" && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 font-medium">{message}</p>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => navigate("/login")}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                    >
                      Go to Login
                    </button>
                    <button
                      onClick={() => navigate("/signup")}
                      className="w-full border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:border-blue-500 hover:text-blue-600 transition-all duration-200"
                    >
                      Sign Up Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
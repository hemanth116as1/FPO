"use client"
import "../LoginForm.css";

export default function ForgotPassword() {
    return (
        <div className="forgot-password-container">
            <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = {
                    phonenumber: String(formData.get("phonenumber") ?? ""),
                };

                console.log("Submitting OTP request:", data);

                const response = await fetch("/login/api/auth/sendOTP", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(data),
                });

                const result = await response.json();
                console.log("OTP API response:", result);
            }}>
                <h2 className="forgot-password-title">Forgot Password</h2>
                <label htmlFor="phonenumber">Phone Number</label>
                <input type="text" name="phonenumber" id="phonenumber" placeholder="Enter your Phone Number" />
                <button type="submit">
                    Send OTP
                </button>
            </form>
        </div>
    )
}
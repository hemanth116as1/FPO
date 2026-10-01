"use client"
import "../LoginForm.css";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function ForgotPassword() {
    const [otpSent, setOtpSent] = useState(false);
    const [phoneError, setPhoneError] = useState("");
    const [otpError, setOtpError] = useState("");
    const router = useRouter();
    return (
        <div className="forgot-password-container">
            <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = {
                    phonenumber: String(formData.get("phonenumber") ?? "").trim(),
                    otp: String(formData.get("otp") ?? "").trim(),
                };
                if (!otpSent) {
                    const digits = data.phonenumber.replace(/\D/g, "");
                    const mobileNumber = digits.startsWith("91") && digits.length === 12
                        ? digits.slice(2)
                        : digits;
                    if (!mobileNumber) {
                        setPhoneError("Mobile number is required.");
                        return;
                    }
                    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
                        setPhoneError("Enter a valid mobile number.");
                        return;
                    }
                    setPhoneError("");

                    try {
                        const response = await fetch("/login/api/auth/sendOTP", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ phonenumber: mobileNumber }),
                        });

                        const result = await response.json();
                        if (result.success) {
                            setOtpSent(true);
                        } else {
                            setPhoneError("Unable to send OTP. Check the number and try again.");
                        }
                    } catch {
                        setPhoneError("Unable to send OTP. Try again.");
                    }
                } else {
                    if (!data.otp) {
                        setOtpError("Enter the OTP.");
                        return;
                    }

                    setOtpError("");
                    try {
                        const response = await fetch("/api/otpservices/verifyOTP", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(data),
                        });
                        const result = await response.json();
                        if (result.success) {
                            router.push("/login/reset-password");
                        } else {
                            setOtpError("Invalid value entered");
                        }
                    } catch {
                        setOtpError("Invalid value entered");
                    }
                }
            }}>
                <h2 className="forgot-password-title">Forgot Password</h2>
                <label htmlFor="phonenumber">Phone Number</label>
                <input
                    type="tel"
                    name="phonenumber"
                    id="phonenumber"
                    placeholder="Enter your Phone Number"
                    aria-invalid={Boolean(phoneError)}
                    aria-describedby={phoneError ? "phonenumber-error" : undefined}
                    onChange={() => setPhoneError("")}
                />
                {phoneError && <p className="forgot-password-error" id="phonenumber-error" role="alert">{phoneError}</p>}
                {!otpSent && (
                    <button type="submit">
                        Send OTP
                    </button>
                )}
                {otpSent && (
                    <div>
                        <div>
                            <label htmlFor="otp">Enter OTP</label>
                            <input
                                type="text"
                                name="otp"
                                id="otp"
                                placeholder="Enter OTP"
                                inputMode="numeric"
                                aria-invalid={Boolean(otpError)}
                                aria-describedby={otpError ? "otp-error" : undefined}
                                onChange={() => setOtpError("")}
                            />
                            {otpError && <p className="forgot-password-error" id="otp-error" role="alert">{otpError}</p>}
                        </div>
                        <div>
                            <button type="submit">
                                Verify OTP
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    )
}
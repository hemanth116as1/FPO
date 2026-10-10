"use client"
import "../LoginForm.css";
import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function ForgotPassword() {
    const [otpSent, setOtpSent] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [otpError, setOtpError] = useState("");
    const [success, setSuccess] = useState("");
    return (
        <div className="login-page">
            <div className="login-page__grain" aria-hidden="true" />
            <main className="login-main">
                <header className="login-header">
                    <Link className="login-brand" href="/" aria-label="FPO Dairy Connect home">
                        <span className="login-brand__mark" aria-hidden="true">D</span>
                        <span>FPO Dairy Connect</span>
                    </Link>
                    <Link className="login-home-link" href="/login">Back to sign in</Link>
                </header>

                <section className="login-content" aria-labelledby="forgot-password-title">
                    <p className="login-eyebrow"><span aria-hidden="true" /> Account recovery</p>
                    <h1 className="login-title" id="forgot-password-title">Forgot your <span>password?</span></h1>
                    <p className="login-description">
                        Verify the mobile number linked to your account, then choose a new password.
                    </p>

                    <form className="login-form forgot-password-form" onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const data = {
                            phonenumber: String(formData.get("phonenumber") ?? "").trim(),
                            otp: String(formData.get("otp") ?? "").trim(),
                            password: String(formData.get("password") ?? ""),
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
                                const normalizedPhoneNumber = `+91${mobileNumber}`;
                                const { error } = await authClient.phoneNumber.requestPasswordReset({
                                    phoneNumber: normalizedPhoneNumber,
                                });

                                if (!error) {
                                    setPhoneNumber(normalizedPhoneNumber);
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
                            if (data.password.length < 8) {
                                setOtpError("Password must be at least 8 characters.");
                                return;
                            }
                            try {
                                const { error } = await authClient.phoneNumber.resetPassword({
                                    phoneNumber,
                                    otp: data.otp,
                                    newPassword: data.password,
                                });
                                if (!error) {
                                    setSuccess("Password updated. You can now sign in.");
                                } else {
                                    setOtpError(error.message || "Unable to reset the password.");
                                }
                            } catch (cause) {
                                console.error("Password reset failed:", cause);
                                setOtpError("Unable to reset the password. Please try again.");
                            }
                        }
                    }}>
                        <div className="login-field">
                            <label htmlFor="phonenumber">Phone number</label>
                            <input
                                type="tel"
                                name="phonenumber"
                                id="phonenumber"
                                placeholder="Enter your phone number"
                                autoComplete="tel"
                                aria-invalid={Boolean(phoneError)}
                                aria-describedby={phoneError ? "phonenumber-error" : undefined}
                                onChange={() => setPhoneError("")}
                                readOnly={otpSent}
                            />
                            {phoneError && <p className="forgot-password-error" id="phonenumber-error" role="alert">{phoneError}</p>}
                        </div>
                        {otpSent && (
                            <>
                                <div className="login-field">
                                    <label htmlFor="otp">Verification code</label>
                                    <input
                                        type="text"
                                        name="otp"
                                        id="otp"
                                        placeholder="Enter your verification code"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        aria-invalid={Boolean(otpError)}
                                        aria-describedby={otpError ? "otp-error" : undefined}
                                        onChange={() => setOtpError("")}
                                        required
                                    />
                                    {otpError && <p className="forgot-password-error" id="otp-error" role="alert">{otpError}</p>}
                                </div>
                                <div className="login-field">
                                    <label htmlFor="password">New password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        id="password"
                                        placeholder="At least 8 characters"
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                    />
                                </div>
                            </>
                        )}
                        {success && <p role="status">{success}</p>}
                        {!success && <button className="login-submit" type="submit">
                            {otpSent ? "Reset password" : "Send verification code"}
                            <span aria-hidden="true">&rarr;</span>
                        </button>}
                    </form>
                </section>

                <footer className="login-footer">
                    <span>FPO</span>
                    <span className="login-footer__line" aria-hidden="true" />
                    <span>DAIRY CONNECT</span>
                </footer>
            </main>

            <aside className="login-visual" aria-hidden="true">
                <span className="login-visual__number">01</span>
                <span className="login-visual__message">Together<br />from farm<br />to collection.</span>
                <span className="login-visual__ring" />
            </aside>
        </div>
    )
}
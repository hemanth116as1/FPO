"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import "../LoginForm.css";

function normalizeIndianPhoneNumber(input: string) {
  const digits = input.replace(/\D/g, "");
  const nationalNumber =
    digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;

  return /^[6-9]\d{9}$/.test(nationalNumber)
    ? `+91${nationalNumber}`
    : null;
}

export default function Register() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      if (!otpSent) {
        const normalizedPhoneNumber = normalizeIndianPhoneNumber(
          String(formData.get("phoneNumber") ?? ""),
        );

        if (!normalizedPhoneNumber) {
          setError("Enter a valid Indian mobile number.");
          return;
        }

        const { error: sendError } = await authClient.phoneNumber.sendOtp({
          phoneNumber: normalizedPhoneNumber,
        });
        if (sendError) {
          setError(sendError.message || "Unable to send the verification code.");
          return;
        }

        setPhoneNumber(normalizedPhoneNumber);
        setOtpSent(true);
        return;
      }

      const code = String(formData.get("otp") ?? "").trim();
      if (!code) {
        setError("Enter the verification code.");
        return;
      }

      const { error: verifyError } = await authClient.phoneNumber.verify({
        phoneNumber,
        code,
      });
      if (verifyError) {
        setError(verifyError.message || "The verification code is invalid.");
        return;
      }

      router.push("/login/complete-profile");
    } catch (cause) {
      console.error("Phone signup failed:", cause);
      setError("Signup could not be completed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

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

        <section className="login-content" aria-labelledby="register-title">
          <p className="login-eyebrow"><span aria-hidden="true" /> Create your account</p>
          <h1 className="login-title" id="register-title">Join <span>FPO.</span></h1>
          <p className="login-description">
            Verify your mobile number first. You&apos;ll add your name and password next.
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            {!otpSent ? (
              <div className="login-field">
                <label htmlFor="phoneNumber">Mobile number</label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  autoComplete="tel"
                  placeholder="Enter your mobile number"
                  required
                />
              </div>
            ) : (
              <>
                <div className="login-field">
                  <label htmlFor="phoneNumberDisplay">Mobile number</label>
                  <input
                    id="phoneNumberDisplay"
                    type="tel"
                    value={phoneNumber}
                    readOnly
                  />
                </div>
                <div className="login-field">
                  <label htmlFor="otp">Verification code</label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Enter the code sent to your phone"
                    required
                  />
                </div>
              </>
            )}
            {error && <p role="alert">{error}</p>}
            <button className="login-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Please wait..."
                : otpSent
                  ? "Verify mobile number"
                  : "Send verification code"}
              <span aria-hidden="true">&rarr;</span>
            </button>
            {otpSent && (
              <button
                className="login-secondary"
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setPhoneNumber("");
                  setError("");
                }}
              >
                Change mobile number
              </button>
            )}
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
  );
}
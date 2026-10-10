"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import "../LoginForm.css";

export default function CompleteProfile() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setIsSubmitting(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });
      const result: { error?: string } = await response.json();

      if (!response.ok) {
        setError(result.error || "Unable to finish setting up your account.");
        return;
      }

      await authClient.getSession();
      router.replace("/home");
    } catch (cause) {
      console.error("Profile setup failed:", cause);
      setError("Unable to finish setting up your account. Please try again.");
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
        </header>

        <section className="login-content" aria-labelledby="complete-profile-title">
          <p className="login-eyebrow"><span aria-hidden="true" /> Mobile verified</p>
          <h1 className="login-title" id="complete-profile-title">Almost <span>there.</span></h1>
          <p className="login-description">
            Add your name and choose a password for future sign-ins.
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="name">Your name</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Enter your name"
                minLength={2}
                required
              />
            </div>
            <div className="login-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
            </div>
            <div className="login-field">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Enter the password again"
                minLength={8}
                required
              />
            </div>
            {error && <p role="alert">{error}</p>}
            <button className="login-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Finish account setup"}
              <span aria-hidden="true">&rarr;</span>
            </button>
          </form>
        </section>

        <footer className="login-footer">
          <span>FPO</span>
          <span className="login-footer__line" aria-hidden="true" />
          <span>DAIRY CONNECT</span>
        </footer>
      </main>
      <aside className="login-visual" aria-hidden="true">
        <span className="login-visual__number">02</span>
        <span className="login-visual__message">Your farm<br />workspace<br />starts here.</span>
        <span className="login-visual__ring" />
      </aside>
    </div>
  );
}

"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import "./LoginForm.css";
import Link from "next/link"
import {authClient} from "@/lib/auth-client";
export default function Form() {
    const router = useRouter();
    interface FormData {
        phoneNumber: string;
        password: string;
    }
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    return (
        <div className="login-page">
            <div className="login-page__grain" aria-hidden="true" />
            <main className="login-main">
                <header className="login-header">
                    <Link className="login-brand" href="/" aria-label="FPO Dairy Connect home">
                        <span className="login-brand__mark" aria-hidden="true">D</span>
                        <span>FPO Dairy Connect</span>
                    </Link>
                    <Link className="login-home-link" href="/">Back to home</Link>
                </header>

                <section className="login-content" aria-labelledby="login-title">
                    <p className="login-eyebrow"><span aria-hidden="true" /> Dairy workspace</p>
                    <h1 className="login-title" id="login-title">Welcome <span>back.</span></h1>
                    <p className="login-description">Sign in to stay connected with your farm and daily collection.</p>

                    <form
                        className="login-form"
                        onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const data: FormData = {
                                phoneNumber: String(formData.get("phoneNumber") ?? ""),
                                password: String(formData.get("password") ?? ""),
                            };
                            const digits = data.phoneNumber.replace(/\D/g, "");
                            const nationalNumber =
                                digits.length === 12 && digits.startsWith("91")
                                    ? digits.slice(2)
                                    : digits;
                            if (!/^[6-9]\d{9}$/.test(nationalNumber)) {
                                setError("Enter a valid Indian mobile number.");
                                return;
                            }

                            setError("");
                            setIsSubmitting(true);
                            try {
                                const { error: signInError } =
                                    await authClient.signIn.phoneNumber({
                                        phoneNumber: `+91${nationalNumber}`,
                                        password: data.password,
                                    });
                                if (signInError) {
                                    setError(signInError.message || "Sign-in failed.");
                                    return;
                                }
                                router.push("/home");
                            } catch (cause) {
                                console.error("Unexpected error during sign-in:", cause);
                                setError("An unexpected error occurred. Please try again.");
                            } finally {
                                setIsSubmitting(false);
                            }
                        }}
                    >
                        <div className="login-field">
                            <label htmlFor="phoneNumber">Mobile number</label>
                            <input type="tel" name="phoneNumber" id="phoneNumber" placeholder="Enter your mobile number" autoComplete="tel" required />
                        </div>
                        <div className="login-field">
                            <label htmlFor="password">Password</label>
                            <input type="password" name="password" id="password" placeholder="Enter your password" autoComplete="current-password" required />
                        </div>
                        <div className="login-options">
                            <Link href="/login/forgot-password">Forgot password?</Link>
                        </div>
                        {error && <p role="alert">{error}</p>}
                        <button className="login-submit" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Signing in..." : "Sign in"}
                            <span aria-hidden="true">&rarr;</span>
                        </button>
                        <p className="login-register">New to FPO Dairy Connect? <Link href="/login/register">Create an account</Link></p>
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
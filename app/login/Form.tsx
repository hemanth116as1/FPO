"use client"
import "./LoginForm.css";
import Link from "next/link"
export default function Form() {
    interface FormData {
        username: string;
        password: string;
    }

    return (
        <form
            className="login-form"
            onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data: FormData = {
                    username: String(formData.get("username") ?? ""),
                    password: String(formData.get("password") ?? ""),
                };
                console.log(data);
            }}
        >
            <h2 className="login-form__title">Login</h2>
            <label htmlFor="username">Username</label>
            <input type="text" name="username" id="username" placeholder="Enter your username" />
            <label htmlFor="password">Password</label>
            <input type="password" name="password" id="password" placeholder="Enter your password" />
            <Link href="/login/forgot-password" >
                Forgot Password?
            </Link>
            <Link href="/login/register" >
                Register
            </Link>
            <button type="submit">Submit</button>
        </form>
    );
}
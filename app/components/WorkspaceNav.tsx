"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import styles from "./WorkspaceNav.module.css";

export default function WorkspaceNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState("");
  const activePage = pathname === "/milkrecords" ? "milkrecords" : "home";

  async function handleSignOut() {
    setIsSigningOut(true);
    setError("");

    try {
      const result = await authClient.signOut();
      if (result.error) {
        throw new Error(result.error.message || "Unable to sign out.");
      }
      router.replace("/login");
      router.refresh();
    } catch (cause) {
      console.error("Sign out failed:", cause);
      setError("Unable to sign out. Please try again.");
      setIsSigningOut(false);
    }
  }

  return (
    <div className={styles.container}>
      <nav className={styles.nav} aria-label="Main navigation">
        <Link className={styles.brand} href="/home" aria-label="FPO Dairy Connect home">
          <span className={styles.brandMark} aria-hidden="true">D</span>
          <span>FPO Dairy Connect</span>
        </Link>

        <div className={styles.actions}>
          <Link
            className={activePage === "home" ? styles.activeLink : styles.link}
            href="/home"
            aria-current={activePage === "home" ? "page" : undefined}
          >
            Home
          </Link>
          <Link
            className={activePage === "milkrecords" ? styles.activeLink : styles.link}
            href="/milkrecords"
            aria-current={activePage === "milkrecords" ? "page" : undefined}
          >
            Milk records
          </Link>
          <button
            className={styles.signOut}
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </nav>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}

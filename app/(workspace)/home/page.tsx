"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import styles from "../../home/Home.module.css";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [isPending, router, session]);

  return (
    <section className={styles.welcome} aria-labelledby="welcome-title">
      {isPending || !session ? (
        <div className={styles.loading} role="status" aria-live="polite">
          <span className={styles.loadingMark} aria-hidden="true" />
          <span>Loading your workspace</span>
        </div>
      ) : (
        <>
          <p className={styles.eyebrow}><span aria-hidden="true" /> Dairy workspace</p>
          <h1 id="welcome-title">Welcome back, <span>{session.user.name}</span>.</h1>
          <p className={styles.description}>
            Your dairy workspace is ready. View and manage your milk records from the navigation above.
          </p>
        </>
      )}
    </section>
  );
}
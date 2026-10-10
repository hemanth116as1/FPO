  "use client";

  import { authClient } from "@/lib/auth-client";
  import styles from "./home/Home.module.css";
  import { useEffect } from "react";
  import { useRouter } from "next/navigation";
 
  export default function Home() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  useEffect(() => {
    if (!isPending && session) {
      router.push("/home");
    }
  }, [isPending, router, session]);

  const showLoading = isPending;

  return (
    <main className={styles.page}>
      <div className={styles.grain} aria-hidden="true" />
      <div className={styles.content}>
        <header className={styles.header}>
          <a className={styles.brand} href="/home" aria-label="FPO Dairy Connect home">
            <span className={styles.brandMark} aria-hidden="true">D</span>
            <span>FPO Dairy Connect</span>
          </a>
          <span className={styles.workspace}><span /> Dairy workspace</span>
        </header>

        <section className={styles.welcome} aria-labelledby="welcome-title">
          {showLoading ? (
            <div className={styles.loading} role="status" aria-live="polite">
              <span className={styles.loadingMark} aria-hidden="true" />
              <span>Loading your workspace</span>
            </div>
          ) : (
            <>
              <p className={styles.eyebrow}><span aria-hidden="true" /> A better way to work together</p>
              <h1 id="welcome-title">Every drop tells a story of <span>community.</span></h1>
              <p className={styles.description}>
                FPO Dairy Connect brings farmers and collection teams together to make daily milk collection clearer, simpler, and more rewarding.
              </p>
              <button
                className={styles.primaryButton}
                type="button"
                onClick={() => router.push("/login")}
              >
                Get Started
                <span aria-hidden="true">&rarr;</span>
              </button>
              <footer className={styles.footer}>
                <span>FPO</span>
                <span className={styles.footerLine} aria-hidden="true" />
                <span>DAIRY CONNECT</span>
              </footer>
            </>
          )}
        </section>
      </div>
      <aside className={styles.sidePanel} aria-hidden="true">
        <span className={styles.panelNumber}>01</span>
        <span className={styles.panelLabel}>Together<br />from farm<br />to collection.</span>
        <span className={styles.panelRing} />
      </aside>
    </main>
  );
}
import type { ReactNode } from "react";
import WorkspaceNav from "@/app/components/WorkspaceNav";
import styles from "../home/Home.module.css";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <main className={styles.page}>
      <div className={styles.grain} aria-hidden="true" />
      <div className={styles.content}>
        <WorkspaceNav />
        <div className={styles.routeContent}>{children}</div>
        <footer className={styles.footer}>
          <span>FPO</span>
          <span className={styles.footerLine} aria-hidden="true" />
          <span>DAIRY CONNECT</span>
        </footer>
      </div>
      <aside className={styles.sidePanel} aria-hidden="true">
        <span className={styles.panelNumber}>FPO</span>
        <span className={styles.panelLabel}>Your dairy<br />workspace,<br />all in one place.</span>
        <span className={styles.panelRing} />
      </aside>
    </main>
  );
}

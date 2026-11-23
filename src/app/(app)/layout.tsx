import Link from "next/link";
import SideNav from "@/components/Shell/SideNav";
import BottomBar from "@/components/Shell/BottomBar";
import { LogoMark } from "@/components/icons";
import { requireOwner } from "@/lib/session";
import { longDate, today } from "@/lib/dates";
import styles from "@/components/Shell/Shell.module.css";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOwner();

  return (
    <>
      <header className={styles.top}>
        <Link href='/' className={styles.brand}>
          <LogoMark className={styles.logo} />
          Habit Tracker
        </Link>
        <span className={styles.topDate}>{longDate(today())}</span>
      </header>
      <div className={styles.wrap}>
        <aside className={styles.left}>
          <SideNav />
        </aside>
        <main className={styles.right}>{children}</main>
      </div>
      <BottomBar />
    </>
  );
}

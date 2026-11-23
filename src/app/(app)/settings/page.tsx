import PageIntro from "@/components/PageIntro/PageIntro";
import GoalsForm from "@/components/Settings/GoalsForm";
import CategoriesEditor from "@/components/Settings/CategoriesEditor";
import PasswordForm from "@/components/Settings/PasswordForm";
import { logout } from "@/actions/auth";
import { getCategories, getGoals, getSettings } from "@/lib/data";
import { TIMEZONE } from "@/lib/dates";
import { requireOwner } from "@/lib/session";
import styles from "@/components/Settings/Settings.module.css";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [user, categories, settings, goals] = await Promise.all([
    requireOwner(),
    getCategories(),
    getSettings(),
    getGoals(),
  ]);

  return (
    <div className={styles.page}>
      <PageIntro
        eyebrow='Settings'
        heading='Settings'
        copy={`Signed in as ${user.email}. Days follow the ${TIMEZONE.replace("_", " ")} time zone.`}
      />
      <div className={styles.columns}>
        <section className='panel'>
          <h2 className='cardTitle'>Goals</h2>
          <GoalsForm
            calorieGoal={settings.calorieGoal}
            proteinGoal={settings.proteinGoal}
            proteinPerLb={settings.proteinPerLb}
            meatRotation={settings.meatRotation}
            suggested={goals.proteinSuggested}
          />
        </section>

        <section className='panel'>
          <h2 className='cardTitle'>Categories</h2>
          <CategoriesEditor categories={categories} />
        </section>

        <section className='panel'>
          <h2 className='cardTitle'>Password</h2>
          <PasswordForm />
        </section>

        <section className='panel panelIvory'>
          <h2 className='cardTitle'>On your phone</h2>
          <ol className={styles.steps}>
            <li>Open this site in Safari on your iPhone.</li>
            <li>Tap the Share button, then &quot;Add to Home Screen&quot;.</li>
            <li>
              It opens full screen, like an app, and stays signed in for 30
              days.
            </li>
          </ol>
          <form action={logout}>
            <button type='submit' className='dangerBtn'>
              Sign out
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

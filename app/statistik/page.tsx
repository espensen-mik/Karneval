import { redirect } from "next/navigation";
import { requireResearchSession } from "@/lib/research-auth";
import { dbRequest } from "@/lib/server-db";
import styles from "./statistics.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Statistik · Sjælen", robots: { index: false, follow: false } };
type Day = { day: string; logins: number; unique_ips: number };
type Stats = { total: number; unique_ips: number; last_30_days: number; unique_30_days: number; unknown_ips: number; first_login: string | null; days: Day[] };
export default async function StatisticsPage() {
  if (await requireResearchSession()) redirect("/login?next=/statistik");
  let stats: Stats;
  try { stats = await (await dbRequest("rpc/research_login_statistics", { method: "POST", body: "{}" })).json(); }
  catch { return <main className={styles.page}><h1>Login-statistik</h1><p>Statistikken kunne ikke hentes. Prøv at genindlæse siden.</p></main>; }
  const number = (value: number) => value.toLocaleString("da-DK");
  return <main className={styles.page}>
    <p className={styles.eyebrow}>BRUGEN AF SJÆLEN</p><h1>Login-statistik<span>.</span></h1>
    <p>Vellykkede logins til den passwordbeskyttede del af Sjælen.</p>
    <div className={styles.metrics}>{[["Forskellige IP-adresser", stats.unique_ips], ["Logins i alt", stats.total], ["IP-adresser · seneste 30 dage", stats.unique_30_days], ["Logins · seneste 30 dage", stats.last_30_days]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{number(value as number)}</strong></div>)}</div>
    <h2>De seneste 30 dage</h2>
    <div className={styles.table}><table><thead><tr><th>Dato</th><th>Logins</th><th>Forskellige IP-adresser</th></tr></thead><tbody>{stats.days.map(day => <tr key={day.day}><td>{new Intl.DateTimeFormat("da-DK", { day: "numeric", month: "short", timeZone: "Europe/Copenhagen" }).format(new Date(`${day.day}T12:00:00Z`))}</td><td>{number(day.logins)}</td><td>{number(day.unique_ips)}</td></tr>)}</tbody></table></div>
    <p className={styles.note}>Optællingen starter med denne funktion og omfatter kun nye logins, ikke sidebesøg eller besvarelser af spørgeskemaet. Flere personer kan dele en IP-adresse, og samme person kan bruge flere. IP-adresser gemmes kun som en nøglebeskyttet kode; rå adresser vises og gemmes ikke. Skiftes servernøglen, tælles adresserne på ny.{stats.unknown_ips > 0 && ` ${number(stats.unknown_ips)} logins mangler en tilgængelig IP-adresse og indgår kun i antallet af logins.`}</p>
  </main>;
}

"use client";

import UiIcon, { type IconName } from "./ui-icon";
import Link from "next/link";
import { WORKSHOP_PAGES } from "@/lib/workshop";
import KarmanautCredit from "./karmanaut-credit";
import { Fragment, useState } from "react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Overblik", icon: "home" },
  { href: "/kilder", label: "Kilder", icon: "arrow" },
  { href: "/citater", label: "Citater", icon: "quote" },
  { href: "/den-digitale-sjael", label: "Den digitale sjæl", icon: "digital" },
  { href: "/sjaelemoede", label: "Sjælemøde", icon: "digital" },
  { href: "/sjaelen/ordnetvaerk", label: "SJÆLEN", icon: "soul" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  return (
    <aside className="sidebar">
      <Link className="brand" href="/">
        <span className="brand-mark brand-mark-image"><img src="/logo/karmanaut_fav.svg" alt="" aria-hidden="true" /></span>
        <span>
          <span className="brand-name">Sjælen af Karneval</span>
        </span>
      </Link>
      <nav className="primary-nav" aria-label="Hovedmenu">
        {links.map((link) => {
          const active = link.href === "/" ? pathname === "/" : link.href === "/sjaelen/ordnetvaerk" ? pathname.startsWith("/sjaelen/") : pathname.startsWith(link.href);
          return (
            <Fragment key={link.href}><Link className={`${active ? "nav-link active" : "nav-link"}${link.href === "/sjaelen/ordnetvaerk" ? " nav-soul" : ""}`} href={link.href}>
              <span className="nav-icon" aria-hidden="true"><UiIcon name={link.icon as IconName} /></span>
              <span>{link.label}</span>
              {active && <span className="nav-dot" />}
            </Link>
            {link.href === "/sjaelemoede" && pathname.startsWith("/sjaelemoede") && WORKSHOP_PAGES.map(page=><Link key={page.slug} className={`nav-soul-sub nav-workshop-sub${pathname===`/sjaelemoede/${page.slug}`?" active":""}`} href={`/sjaelemoede/${page.slug}`} aria-current={pathname===`/sjaelemoede/${page.slug}`?"page":undefined}>{page.label}</Link>)}
            {link.href === "/den-digitale-sjael" && pathname.startsWith("/den-digitale-sjael") && <Link className={`nav-soul-sub nav-digital-sub${pathname === "/den-digitale-sjael/udvalgte-stemmer" ? " active" : ""}`} href="/den-digitale-sjael/udvalgte-stemmer" aria-current={pathname === "/den-digitale-sjael/udvalgte-stemmer" ? "page" : undefined}>Udvalgte stemmer</Link>}
            {link.href === "/den-digitale-sjael" && pathname.startsWith("/den-digitale-sjael") && <Link className={`nav-soul-sub nav-digital-sub${pathname === "/den-digitale-sjael/analyse" ? " active" : ""}`} href="/den-digitale-sjael/analyse" aria-current={pathname === "/den-digitale-sjael/analyse" ? "page" : undefined}>Analyse</Link>}
            {link.href === "/sjaelen/ordnetvaerk" && pathname.startsWith("/sjaelen") && <Link className={`nav-soul-sub${pathname === "/sjaelen/kuratering" ? " active" : ""}`} href="/sjaelen/kuratering" aria-current={pathname === "/sjaelen/kuratering" ? "page" : undefined}>Kuratering & visning</Link>}
            {link.href === "/sjaelen/ordnetvaerk" && pathname.startsWith("/sjaelen") && <Link className={`nav-soul-sub${pathname === "/sjaelen/leg-med-ord" ? " active" : ""}`} href="/sjaelen/leg-med-ord" aria-current={pathname === "/sjaelen/leg-med-ord" ? "page" : undefined}>Leg med ord</Link>}
            {link.href === "/sjaelen/ordnetvaerk" && pathname.startsWith("/sjaelen") && <Link className={`nav-soul-sub${pathname === "/sjaelen/ordsky" ? " active" : ""}`} href="/sjaelen/ordsky" aria-current={pathname === "/sjaelen/ordsky" ? "page" : undefined}>Ordsky</Link>}
            </Fragment>
          );
        })}
      </nav>
      <KarmanautCredit className="sidebar-credit" />
      <div className="sidebar-session"><button disabled={loggingOut} onClick={async () => { setLoggingOut(true); setLogoutError(""); try { const response = await fetch("/api/session", { method: "DELETE" }); if (!response.ok) throw new Error(); window.location.assign("/login"); } catch { setLogoutError("Prøv igen."); setLoggingOut(false); } }}>{loggingOut ? "Logger ud …" : "Log ud"}</button>{logoutError && <span role="alert">{logoutError}</span>}</div>
    </aside>
  );
}

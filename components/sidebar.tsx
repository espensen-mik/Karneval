"use client";

import UiIcon, { type IconName } from "./ui-icon";
import Link from "next/link";
import Image from "next/image";
import { Fragment } from "react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Overblik", icon: "home" },
  { href: "/kilder", label: "Kilder", icon: "arrow" },
  { href: "/citater", label: "Citater", icon: "quote" },
  { href: "/sjaelen", label: "SJÆLEN", icon: "soul" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sidebar">
      <Link className="brand" href="/">
        <span className="brand-mark">K</span>
        <span>
          <span className="brand-name">Sjælen af Karneval</span>
        </span>
      </Link>
      <nav className="primary-nav" aria-label="Hovedmenu">
        {links.map((link) => {
          const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Fragment key={link.href}><Link className={`${active ? "nav-link active" : "nav-link"}${link.href === "/sjaelen" ? " nav-soul" : ""}`} href={link.href}>
              <span className="nav-icon" aria-hidden="true"><UiIcon name={link.icon as IconName} /></span>
              <span>{link.label}</span>
              {active && <span className="nav-dot" />}
            </Link>
            {link.href === "/sjaelen" && pathname.startsWith("/sjaelen") && <Link className={`nav-soul-sub${pathname === "/sjaelen/kuratering" ? " active" : ""}`} href="/sjaelen/kuratering" aria-current={pathname === "/sjaelen/kuratering" ? "page" : undefined}>Kuratering & visning</Link>}
            {link.href === "/sjaelen" && pathname.startsWith("/sjaelen") && <Link className={`nav-soul-sub${pathname === "/sjaelen/leg-med-ord" ? " active" : ""}`} href="/sjaelen/leg-med-ord" aria-current={pathname === "/sjaelen/leg-med-ord" ? "page" : undefined}>Leg med ord</Link>}
            </Fragment>
          );
        })}
      </nav>
      <a className="sidebar-credit" href="https://www.karmanaut.dk">
        <Image src="/logo/kun_naut_blaa_outline.svg" alt="KARMANAUT" width={80} height={80} />
        <span>
          <strong>SjæleSystem</strong>
          <small>leveret af KARMANAUT</small>
        </span>
      </a>
    </aside>
  );
}

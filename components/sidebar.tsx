"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Overblik", icon: "⌂" },
  { href: "/wiki", label: "Wiki (pause)", icon: "▤", disabled: true },
  { href: "/kilder", label: "Kilder", icon: "↗" },
  { href: "/citater", label: "Citater", icon: "“" },
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
          if (link.disabled) {
            return <span className="nav-link nav-link-disabled" aria-disabled="true" key={link.href}><span className="nav-icon" aria-hidden="true">{link.icon}</span><span>{link.label}</span></span>;
          }
          return (
            <Link className={active ? "nav-link active" : "nav-link"} href={link.href} key={link.href}>
              <span className="nav-icon" aria-hidden="true">{link.icon}</span>
              <span>{link.label}</span>
              {active && <span className="nav-dot" />}
            </Link>
          );
        })}
      </nav>
      <Link className="sidebar-credit" href="/">
        <Image src="/logo/kun_naut_blaa_outline.svg" alt="KARMANAUT" width={64} height={64} />
        <span>
          <strong>SjæleSystem</strong>
          <small>leveret af KARMANAUT</small>
        </span>
      </Link>
    </aside>
  );
}

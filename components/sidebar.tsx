"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Overblik", icon: "◫" },
  { href: "/wiki", label: "Wiki", icon: "▤" },
  { href: "/kilder", label: "Kilderegister", icon: "⌕" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <Link className="brand" href="/">
        <span className="brand-mark">S</span>
        <span>
          <strong>Sjælen af Karneval</strong>
          <small>RESEARCHRUM</small>
        </span>
      </Link>

      <div className="nav-label">ARBEJDSRUM</div>
      <nav className="primary-nav" aria-label="Hovedmenu">
        {links.map((link) => {
          const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link className={active ? "nav-link active" : "nav-link"} href={link.href} key={link.href}>
              <span className="nav-icon" aria-hidden="true">{link.icon}</span>
              <span>{link.label}</span>
              {active && <span className="nav-dot" />}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-note">
          <span className="note-spark">✳</span>
          <p>En levende samling af fakta, stemmer og spor.</p>
        </div>
        <div className="version-label">FØRSTE UDGAVE <span>0.1</span></div>
      </div>
    </aside>
  );
}
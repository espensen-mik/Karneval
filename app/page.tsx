import Image from "next/image";
import Link from "next/link";
import HomeQuotes from "@/components/home-quotes";

export default function Home() {
  return (
    <div className="page-wrap overview-page">
      <header className="topbar overview-topbar">
        <div className="breadcrumbs">AALBORG KARNEVAL <i>·</i> SJÆLEN AF KARNEVAL</div>
        <Link className="topbar-link" href="/citater">Citatsamling <span>↗</span></Link>
      </header>

      <section className="editorial-hero">
        <Image
          className="editorial-hero-image"
          src="/billeder/55294814841_c655854eda_k.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 720px) 100vw, calc(100vw - 244px)"
          style={{ objectPosition: "center 42%" }}
        />
        <div className="editorial-hero-shade" />
        <div className="editorial-hero-copy">
          <div className="eyebrow">AALBORG · SIDEN 1983</div>
          <h1>Sjælen af<br /><em>Karneval</em></h1>
          <p>Et fælles sted for stemmer, fortællinger og viden om Aalborg Karneval.</p>
          <Link className="hero-cta" href="/citater">Gå på opdagelse <span>↗</span></Link>
        </div>
      </section>

      <section className="quote-feature-section" aria-labelledby="quote-feature-title">
        <div className="quote-feature-heading">
          <h2 id="quote-feature-title">Karneval fortalt indefra</h2>
          <p>Et citat ad gangen</p>
        </div>
        <HomeQuotes />
      </section>

      <section className="discover-section">
        <div className="discover-heading">
          <h2>Gå på opdagelse</h2>
          <p>Flere spor ind i Karnevals fortælling.</p>
        </div>
        <div className="discover-grid">
          <Link className="discover-card" href="/kilder">
            <span className="discover-card-index">01</span>
            <span className="discover-card-content"><strong>Kilder</strong><span>Arkiver, undersøgelser og dokumenter.</span></span>
            <span className="discover-card-arrow" aria-hidden="true">↗</span>
          </Link>
          <div className="discover-card discover-card-paused" aria-disabled="true">
            <span className="discover-card-index">02</span>
            <span className="discover-card-content"><strong>Wiki</strong><span>Midlertidigt pauseret · indholdet er bevaret.</span></span>
            <span className="discover-card-state">PAUSE</span>
          </div>
        </div>
      </section>

      <footer className="page-footer overview-footer">
        <span>SJÆLEN AF KARNEVAL</span>
        <span>AALBORG KARNEVAL <i>·</i> 1983—</span>
      </footer>
    </div>
  );
}

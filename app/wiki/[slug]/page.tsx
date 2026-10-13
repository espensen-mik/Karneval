import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articles, sources } from "@/lib/research-data";
import WikiPaused from "@/components/wiki-paused";

const WIKI_ENABLED = false;

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export default async function WikiArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  if (!WIKI_ENABLED) return <WikiPaused />;
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  if (!article) notFound();
  const citedSources = article.sources.map((id) => sources.find((source) => source.id === id)).filter((source) => source !== undefined);

  return (
    <div className="page-wrap">
      <header className="topbar">
        <div className="breadcrumbs"><Link href="/">RESEARCHRUM</Link><i>/</i><Link href="/wiki">Wiki</Link><i>/</i>{article.category}</div>
        <div className="topbar-status"><span className="status-dot" /> Kildebaseret artikel</div>
      </header>
      <Link className="back-link" href="/wiki"><span>←</span> Tilbage til wiki</Link>
      <header className="article-header">
        <div className="eyebrow">{article.category}</div>
        <h1>{article.title}</h1>
        <p className="article-summary">{article.summary}</p>
        <div className="article-info"><span>{article.reading} læsetid</span><span>{article.updated}</span></div>
      </header>
      <div className="article-body">
        <article className="prose">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              {section.points && <ul>{section.points.map((point) => <li key={point}>{point}</li>)}</ul>}
              {section.note && <aside className="editorial-note">{section.note}</aside>}
            </section>
          ))}
        </article>
        <aside className="article-sources">
          <h2>Kilder i denne artikel</h2>
          {citedSources.map((source) => (
            <a className="article-source" href={"/kilder#" + source.id} key={source.id}>
              <strong>{source.title}</strong><span>{source.creator} · {source.date}</span><em>Se kilde ↗</em>
            </a>
          ))}
        </aside>
      </div>
      <div className="next-articles">
        <span>FLERE WIKISIDER</span><br />
        {articles.filter((item) => item.slug !== article.slug).slice(0, 3).map((item) => (
          <Link href={"/wiki/" + item.slug} key={item.slug}>{item.title} ↗</Link>
        ))}
      </div>
      <div className="image-strip" aria-hidden="true">
        <Image src="/billeder/55272795752_cde3fef626_k.jpg" alt="" fill sizes="(max-width: 720px) 100vw, 900px" />
      </div>
      <footer className="page-footer"><span>SJÆLEN AF KARNEVAL <i>·</i> WIKI</span><Link href="/kilder">KILDELISTE ↗</Link></footer>
    </div>
  );
}

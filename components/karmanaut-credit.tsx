import Image from "next/image";
export default function KarmanautCredit({ className }: { className: string }) {
  return <a className={className} href="https://www.karmanaut.dk">
    <Image src="/logo/kun_naut_blaa_outline.svg" alt="KARMANAUT" width={80} height={80} />
    <span><strong>SjæleSystem</strong><small>leveret af KARMANAUT</small></span>
  </a>;
}

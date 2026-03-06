import Link from "next/link";
import { OfficialFooter } from "@/components/site/official-footer";

type OfficialPageShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/contact", label: "Contact" },
  { href: "/terms-and-conditions", label: "Terms" },
  { href: "/refund-and-cancellation-policy", label: "Refunds" },
];

export function OfficialPageShell({
  title,
  subtitle,
  children,
}: OfficialPageShellProps) {
  return (
    <div className="official-shell">
      <header className="official-topbar">
        <Link href="/" className="official-brand">
          StoryWeaver
        </Link>
        <nav aria-label="Main navigation" className="official-nav">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <Link href="/app/create" className="official-app-link">
          Launch App
        </Link>
      </header>

      <main className="official-main">
        <section className="official-hero">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </section>
        <section className="official-card">{children}</section>
      </main>

      <OfficialFooter />
    </div>
  );
}

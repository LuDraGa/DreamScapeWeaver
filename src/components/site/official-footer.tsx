import Link from "next/link";

type OfficialFooterProps = {
  className?: string;
};

const legalLinks = [
  { href: "/contact", label: "Contact" },
  { href: "/terms-and-conditions", label: "Terms & Conditions" },
  { href: "/refund-and-cancellation-policy", label: "Refund & Cancellation" },
];

export function OfficialFooter({ className = "" }: OfficialFooterProps) {
  return (
    <footer className={`official-footer ${className}`.trim()}>
      <div className="official-footer-inner">
        <p>© {new Date().getFullYear()} Abhiroop Prasad Ventures. All rights reserved.</p>
        <nav aria-label="Legal links" className="official-footer-links">
          {legalLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

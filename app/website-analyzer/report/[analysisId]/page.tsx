import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AnalyzerReport } from "../../ui";
import { MobileMenu } from "../../../components/mobile-menu";
import { SiteFooter } from "../../../components/site-footer";

export const metadata: Metadata = { title: "Website Analysis Report | Adwice", robots: { index: false, follow: false } };
export default async function WebsiteAnalyzerReportPage({ params }: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = await params;
  return (
    <div className="analyzerReportShell">
      <header className="nav shell analyzerNav reportNav">
        <Link className="brand" href="/">
          <Image
            src="/brand/adwice-with-text.svg"
            alt="Adwice"
            width={247}
            height={86}
          />
        </Link>
        <div className="navActions">
          <Link className="navCta" href="/website-analyzer">
            New analysis ↗
          </Link>
          <MobileMenu
            links={[
              { label: "Home", href: "/" },
              { label: "Features", href: "/platform" },
              { label: "Website Analyzer", href: "/website-analyzer" },
            ]}
            action={{ label: "New analysis", href: "/website-analyzer" }}
          />
        </div>
      </header>
      <AnalyzerReport analysisId={analysisId} />
      <SiteFooter />
    </div>
  );
}

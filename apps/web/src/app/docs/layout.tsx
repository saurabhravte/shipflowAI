import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { DocsSidebar } from "@/components/marketing/docs-sidebar";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <SiteHeader />
      <div className="mx-auto flex max-w-7xl gap-10 px-5 py-12 lg:px-8">
        <aside className="sticky top-24 hidden h-fit w-56 shrink-0 lg:block">
          <DocsSidebar />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <SiteFooter />
    </div>
  );
}

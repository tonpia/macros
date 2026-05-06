import BottomNav from "@/components/layout/bottom-nav";
import Header from "@/components/layout/header";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-white">
      <Header />
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}

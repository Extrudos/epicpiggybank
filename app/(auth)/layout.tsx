import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="h-16 flex items-center px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🐷</span>
          <span className="text-lg font-bold" style={{ fontFamily: "var(--font-fredoka)" }}>
            EpicPiggyBank
          </span>
        </Link>
      </nav>
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}

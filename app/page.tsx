import Link from "next/link";

const FEATURES = [
  {
    icon: "🪙",
    title: "Track Every Penny",
    desc: "Allowances, gifts, chores, and more — all in one place.",
  },
  {
    icon: "🎯",
    title: "Savings Goals",
    desc: "Kids set targets and watch their progress grow.",
  },
  {
    icon: "🏆",
    title: "Earn Badges & Level Up",
    desc: "Gamified savings with streaks, badges, and collectibles.",
  },
  {
    icon: "👨‍👩‍👧‍👦",
    title: "Parent Oversight",
    desc: "Approve transactions, manage allowances, stay in control.",
  },
  {
    icon: "🔐",
    title: "Kid-Safe Login",
    desc: "PIN-based access for kids — no email required.",
  },
  {
    icon: "📊",
    title: "Family Dashboard",
    desc: "See everyone's balances and activity at a glance.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐷</span>
            <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-fredoka)" }}>
              EpicPiggyBank
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div
            className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
            style={{ background: "var(--kid-coral)" }}
          />
          <div
            className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-15"
            style={{ background: "var(--kid-sky)" }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-10"
            style={{ background: "var(--kid-gold)" }}
          />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <span>🎉</span>
            <span>Teaching kids money skills, the fun way</span>
          </div>

          <h1
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
            style={{ fontFamily: "var(--font-fredoka)" }}
          >
            Where Kids Learn to
            <span className="block balance-amount">Save & Grow</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            EpicPiggyBank makes money tracking magical for families.
            Kids log earnings, set savings goals, and earn badges —
            while parents keep full oversight.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg hover:opacity-90 transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              Get Started Free
              <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <span className="text-sm text-muted-foreground">
              Free for up to 2 kids. No credit card needed.
            </span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            className="text-3xl sm:text-4xl font-bold text-center mb-4"
            style={{ fontFamily: "var(--font-fredoka)" }}
          >
            Everything Your Family Needs
          </h2>
          <p className="text-center text-muted-foreground mb-14 max-w-xl mx-auto">
            Built for real families, with tools kids love and parents trust.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <span className="text-3xl mb-3 block">{f.icon}</span>
                <h3 className="text-lg font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            className="text-3xl sm:text-4xl font-bold text-center mb-4"
            style={{ fontFamily: "var(--font-fredoka)" }}
          >
            Simple, Family-Friendly Pricing
          </h2>
          <p className="text-center text-muted-foreground mb-14 max-w-xl mx-auto">
            Start free, upgrade when you&apos;re ready.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free */}
            <div className="bg-card rounded-2xl p-8 shadow-sm border border-border/50">
              <h3 className="text-lg font-semibold mb-1">Free</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-2.5 text-sm">
                {["Up to 2 kids", "Track all money events", "Savings goals", "Badges & levels", "Parent approval flow"].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-6 block w-full text-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                Start Free
              </Link>
            </div>

            {/* Premium */}
            <div className="bg-card rounded-2xl p-8 shadow-sm border-2 border-primary relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                Most Popular
              </div>
              <h3 className="text-lg font-semibold mb-1">Premium</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold">$5</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-2.5 text-sm">
                {["Unlimited kids", "Everything in Free", "Investment tracking", "Kid email notifications", "Priority support", "Exclusive collectibles"].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-6 block w-full text-center rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Start Premium
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐷</span>
            <span className="font-semibold" style={{ fontFamily: "var(--font-fredoka)" }}>
              EpicPiggyBank
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} EpicPiggyBank. Built by ElfiSolutions.
          </p>
        </div>
      </footer>
    </div>
  );
}

import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  Check,
  Dumbbell,
  LayoutDashboard,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Keep member details organized",
    description:
      "Create and update member profiles, assign membership plans, and keep contact details in one easy-to-find roster.",
    iconClass: "bg-indigo-50 text-indigo-600",
  },
  {
    icon: CalendarDays,
    title: "Stay on top of attendance",
    description:
      "Members can check in from their portal, while your team can review gym visits by date.",
    iconClass: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: LayoutDashboard,
    title: "See the gym at a glance",
    description:
      "Get a live overview of total members, active memberships, and assigned membership value.",
    iconClass: "bg-amber-50 text-amber-600",
  },
  {
    icon: BadgeCheck,
    title: "Give members their own portal",
    description:
      "Members can check their plan and membership status, see how many days remain, and revisit their attendance history.",
    iconClass: "bg-violet-50 text-violet-600",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your workspace",
    description: "Set up an owner account for your gym.",
  },
  {
    number: "02",
    title: "Add members and plans",
    description: "Build your roster and keep memberships up to date.",
  },
  {
    number: "03",
    title: "Track every visit",
    description: "Let members check in and review attendance together.",
  },
];

export default function Landing() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-900">
      <header className="relative z-10 border-b border-white/10 bg-slate-950 text-white">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10"
        >
          <Link to="/" className="flex items-center gap-3" aria-label="GymPro home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500 text-white shadow-lg shadow-violet-950/40">
              <Dumbbell className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-xl font-bold tracking-tight">GymPro</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-slate-300 transition hover:text-white"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-slate-300 transition hover:text-white"
            >
              How it works
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-200 transition hover:text-white"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-violet-50 focus:outline-none focus:ring-4 focus:ring-white/20"
            >
              Get started
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </nav>

        <section className="relative isolate">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_15%_30%,rgba(124,58,237,0.22),transparent_42%),radial-gradient(ellipse_at_85%_70%,rgba(79,70,229,0.2),transparent_42%)]" />
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-[1fr_0.95fr] lg:gap-16 lg:px-10 lg:pb-28 lg:pt-24">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-xs font-semibold tracking-wide text-violet-200">
                <span className="h-2 w-2 rounded-full bg-violet-400" />
                GYM MANAGEMENT, ALL IN ONE PLACE
              </p>
              <h1 className="mt-7 text-4xl font-semibold leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-6xl">
                More time for
                <br className="hidden sm:block" /> your gym.{" "}
                <span className="bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">
                  Less admin.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                Bring your member roster, memberships, and attendance into one
                straightforward workspace—with a portal your members can use, too.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-300/30"
                >
                  Create your workspace
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/10"
                >
                  Explore the features
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                  Owner and member accounts
                </span>
                <span className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                  A dedicated gym workspace
                </span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl lg:mx-0 lg:ml-auto">
              <div className="absolute -inset-5 rounded-[2rem] bg-violet-500/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white p-3 shadow-2xl shadow-black/30 sm:p-5">
                <div className="flex items-center justify-between border-b border-slate-100 px-2 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">Gym overview</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Your workspace at a glance
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    LIVE OVERVIEW
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 py-4 sm:gap-3">
                  {[
                    { label: "Members", icon: Users, color: "text-indigo-600" },
                    {
                      label: "Memberships",
                      icon: BadgeCheck,
                      color: "text-emerald-600",
                    },
                    {
                      label: "Attendance",
                      icon: BarChart3,
                      color: "text-amber-600",
                    },
                  ].map(({ label, icon: Icon, color }) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 sm:p-4"
                    >
                      <Icon className={`h-4 w-4 ${color}`} aria-hidden="true" />
                      <p className="mt-5 text-xs font-medium text-slate-500 sm:text-sm">
                        {label}
                      </p>
                      <div className="mt-2 h-2 w-12 rounded-full bg-slate-200" />
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-slate-100 p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Made for the everyday
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        The essentials, within reach
                      </p>
                    </div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                      <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="mt-5 space-y-3">
                    {[
                      "Update a member's plan",
                      "Review today's check-ins",
                      "Check membership status",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 text-sm text-slate-600"
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                          <Check className="h-3 w-3" aria-hidden="true" />
                        </span>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <p className="px-2 pt-3 text-center text-[11px] text-slate-400">
                  Workspace preview · Your data appears after sign in
                </p>
              </div>
            </div>
          </div>
        </section>
      </header>

      <section
        id="features"
        className="scroll-mt-8 px-5 py-20 sm:px-8 sm:py-24 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">
              The essentials, connected
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              A clearer picture of your gym
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Handle the daily details from one place, and give members a simple
              way to stay connected to their membership.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description, iconClass }) => (
              <article
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60"
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClass}`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-8 border-y border-slate-200 bg-slate-50 px-5 py-20 sm:px-8 sm:py-24 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">
              Get started
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              From setup to check-in
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Start with your gym workspace, then bring your members into the
              same simple flow.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3 lg:mt-12">
            {steps.map(({ number, title, description }) => (
              <article
                key={number}
                className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7"
              >
                <p className="text-sm font-bold tracking-widest text-violet-600">
                  {number}
                </p>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 rounded-3xl bg-slate-950 px-6 py-10 text-white sm:px-10 sm:py-12 lg:flex-row lg:items-center lg:justify-between lg:px-14">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-violet-300">
              YOUR GYM, ONE WORKSPACE
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Ready to make the day-to-day a little easier?
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
              Create your gym workspace and bring your member operations together.
            </p>
          </div>
          <Link
            to="/register"
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-violet-50 focus:outline-none focus:ring-4 focus:ring-white/20 lg:self-center"
          >
            Get started
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-5 py-6 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <Dumbbell
              className="h-4 w-4 text-indigo-600"
              aria-hidden="true"
            />
            <span className="text-sm font-bold text-slate-800">GymPro</span>
          </Link>
          <p className="text-xs text-slate-500">
            Member management and attendance, made straightforward.
          </p>
          <Link
            to="/login"
            className="text-sm font-semibold text-slate-600 transition hover:text-indigo-600"
          >
            Sign in
          </Link>
        </div>
      </footer>
    </main>
  );
}

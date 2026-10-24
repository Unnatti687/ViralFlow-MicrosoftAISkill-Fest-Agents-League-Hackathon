import Link from "next/link";
import {
  Rocket,
  RefreshCw,
  Wand2,
  BarChart3,
  Brain,
  TrendingUp,
  LineChart,
  Mic,
  Network,
  Bot,
  ArrowRight,
} from "lucide-react";
import StaggeredMenu from "@/components/StaggeredMenu";
import Beams from "@/components/Beams";
import { Button } from "@/components/ui/button";

const menuItems = [
  { label: "Onboard", ariaLabel: "Start brand onboarding", link: "/onboarding" },
  { label: "Strategy", ariaLabel: "View content strategy", link: "/strategy" },
  { label: "Videos", ariaLabel: "Review generated videos", link: "/videos" },
  { label: "Schedule", ariaLabel: "View publish schedule", link: "/schedule" },
  { label: "Analytics", ariaLabel: "View performance analytics", link: "/analytics" },
  { label: "Log out", ariaLabel: "Log out", link: "/login", action: "logout" },
];

const flowSteps = [
  {
    icon: RefreshCw,
    title: "01. Connect",
    description: "Sync your platforms in seconds with secure API integration.",
  },
  {
    icon: Wand2,
    title: "02. Generate",
    description: "AI crafts custom visual and written content tailored to your brand.",
  },
  {
    icon: BarChart3,
    title: "03. Analyze",
    description: "Real-time tracking of engagement, reach, and conversion data.",
  },
  {
    icon: Brain,
    title: "04. Evolve",
    description: "ViralFlow learns what works and optimizes the next batch automatically.",
  },
];

const features = [
  {
    icon: LineChart,
    iconClass: "text-[#FF1493]",
    title: "Viral Prediction",
    description: "Our algorithms score content potential before you even click publish.",
    stat: "98.2% Accuracy",
  },
  {
    icon: Mic,
    iconClass: "text-cyan-400",
    title: "Brand Voice Sync",
    description: "The AI clones your unique personality so every post feels authentic.",
    stat: "Infinite Scaling",
  },
  {
    icon: Network,
    iconClass: "text-violet-400",
    title: "Multi-Platform",
    description: "Tailored strategies for TikTok, IG, LinkedIn, and X—simultaneously.",
    stat: "One-Click Dispatch",
  },
  {
    icon: Bot,
    iconClass: "text-rose-400",
    title: "24/7 Auto-Pilot",
    description: "Set your goals and let ViralFlow manage your entire digital presence.",
    stat: "Fully Autonomous",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      <StaggeredMenu
        isFixed
        position="right"
        items={menuItems}
        displaySocials={false}
        displayItemNumbering
        logoUrl="/logo.png"
        colors={["#F4A0C8", "#FF1493"]}
        accentColor="#FF1493"
        menuButtonColor="#fff"
        openMenuButtonColor="#fff"
        changeMenuColorOnOpen
      />

      <main>
        {/* Hero */}
        <section className="relative flex min-h-screen items-center px-6 py-36 overflow-hidden">
          <div className="pointer-events-none absolute inset-0 z-0">
            <Beams
              beamWidth={3}
              beamHeight={30}
              beamNumber={20}
              lightColor="#FF1493"
              speed={2}
              noiseIntensity={1.75}
              scale={0.2}
              rotation={30}
            />
          </div>
          <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-16 lg:grid-cols-2">
            <div>
              <h1 className="font-heading text-5xl font-bold leading-tight tracking-tight md:text-7xl">
                Content That{" "}
                <span className="italic text-[#FF1493]">Evolves.</span>
                <br />
                Results That{" "}
                <span className="text-cyan-400">Explode.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                ViralFlow uses self-improving AI to generate, optimize, and perfect
                your social media presence automatically. Stop guessing, start
                growing.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Button
                  asChild
                  size="lg"
                  className="h-auto rounded-xl bg-[#FF1493] px-8 py-4 text-base font-semibold text-white hover:bg-[#e0127f]"
                >
                  <Link href="/onboarding">
                    Start Your Growth
                    <Rocket className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-4">
                <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl">
                  <video
                    className="h-full w-full object-cover"
                    src="/hero.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
              </div>
              <div className="absolute -bottom-8 -left-8 max-w-[240px] rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-md backdrop-saturate-150">
                <div className="mb-2 flex items-center gap-3">
                  <TrendingUp className="size-5 text-[#FF1493]" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#FF1493]">
                    Engagement Rate
                  </span>
                </div>
                <div className="font-heading text-3xl font-bold">+412%</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Self-Optimized by AI
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Flow */}
        <section className="border-y border-border bg-card/40 px-6 py-24" id="how-it-works">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="font-heading text-4xl font-bold md:text-5xl">
                The <span className="italic text-[#FF1493]">Flow</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Our recursive AI engine doesn&apos;t just post content; it learns from
                every interaction to build your digital empire.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-4">
              {flowSteps.map((step) => (
                <div
                  key={step.title}
                  className="group flex flex-col items-center rounded-3xl border border-border bg-card/60 p-8 text-center transition-colors duration-300 hover:border-[#FF1493]/40 hover:bg-card"
                >
                  <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-background text-[#FF1493] transition-colors duration-300 group-hover:bg-[#FF1493] group-hover:text-white">
                    <step.icon className="size-7" />
                  </div>
                  <h3 className="font-heading mb-2 text-lg font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="px-6 py-24" id="features">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 flex flex-col items-end justify-between gap-8 md:flex-row">
              <div className="max-w-xl">
                <h2 className="font-heading text-4xl font-bold md:text-5xl">
                  Supercharged by <span className="text-[#FF1493]">Intelligence</span>
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  The only content engine that gets smarter with every post. Built
                  for creators who refuse to settle for average.
                </p>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex flex-col rounded-3xl border border-border bg-card p-8 transition-colors hover:border-[#FF1493]/40"
                >
                  <feature.icon className={`mb-6 size-9 ${feature.iconClass}`} />
                  <h4 className="font-heading mb-3 text-lg font-semibold">{feature.title}</h4>
                  <p className="mb-6 text-sm text-muted-foreground">{feature.description}</p>
                  <div className="mt-auto border-t border-border pt-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                    {feature.stat}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-border bg-card/40 px-6 py-24">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="font-heading text-4xl font-bold leading-tight md:text-5xl">
              Ready to automate your <br className="hidden md:block" />
              viral success?
            </h2>
            <div className="mt-10 flex flex-col items-center justify-center gap-6 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-auto rounded-2xl bg-[#FF1493] px-12 py-5 text-lg font-bold text-white hover:bg-[#e0127f]"
              >
                <Link href="/onboarding">
                  Join the Flow Now
                  <ArrowRight className="size-5" />
                </Link>
              </Button>
            </div>
            <p className="mt-6 text-sm italic text-muted-foreground">
              &quot;The most powerful tool in our creator arsenal.&quot; — Social Media Today
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
          <p className="font-heading text-lg font-bold text-[#FF1493]">ViralFlow</p>
          <p className="text-xs text-muted-foreground">
            © 2026 ViralFlow AI. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
              System Status: Optimal
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

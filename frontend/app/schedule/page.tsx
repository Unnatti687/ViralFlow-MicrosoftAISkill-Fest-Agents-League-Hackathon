import { Suspense } from "react";
import { ScheduleView } from "@/components/schedule/ScheduleView";
import StaggeredMenu from "@/components/StaggeredMenu";

export const metadata = { title: "Schedule — ViralFlow" };

const menuItems = [
  { label: "Onboard", ariaLabel: "Start brand onboarding", link: "/onboarding" },
  { label: "Strategy", ariaLabel: "View content strategy", link: "/strategy" },
  { label: "Videos", ariaLabel: "Review generated videos", link: "/videos" },
  { label: "Schedule", ariaLabel: "View publish schedule", link: "/schedule" },
  { label: "Analytics", ariaLabel: "View performance analytics", link: "/analytics" },
  { label: "Log out", ariaLabel: "Log out", link: "/login", action: "logout" },
];

export default function SchedulePage() {
  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-[#0a0a0a]">
      <div className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-fuchsia-600/8 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-[400px] w-[400px] rounded-full bg-pink-600/6 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-fuchsia-900/4 blur-[160px]" />
      <StaggeredMenu
        isFixed
        position="right"
        items={menuItems}
        displaySocials={false}
        displayItemNumbering
        colors={["#F4A0C8", "#FF1493"]}
        accentColor="#FF1493"
        menuButtonColor="#fff"
        openMenuButtonColor="#fff"
        changeMenuColorOnOpen
        logoUrl="/logo.png"
      />
      <main className="flex-1 overflow-hidden pt-16">
        <Suspense fallback={null}>
          <ScheduleView />
        </Suspense>
      </main>
    </div>
  );
}

import { ChatInterface } from "@/components/onboarding/ChatInterface";
import DarkVeil from "@/components/DarkVeil";
import StaggeredMenu from "@/components/StaggeredMenu";

export const metadata = { title: "Brand Onboarding — ViralFlow" };

const menuItems = [
  {
    label: "Onboard",
    ariaLabel: "Start brand onboarding",
    link: "/onboarding",
  },
  { label: "Strategy", ariaLabel: "View content strategy", link: "/strategy" },
  { label: "Videos", ariaLabel: "Review generated videos", link: "/videos" },
  { label: "Schedule", ariaLabel: "View publish schedule", link: "/schedule" },
  {
    label: "Analytics",
    ariaLabel: "View performance analytics",
    link: "/analytics",
  },
  { label: "Log out", ariaLabel: "Log out", link: "/login", action: "logout" },
];

export default function OnboardingPage() {
  return (
    <div className="relative flex flex-col h-screen">
      <div className="absolute inset-0 -z-10">
        <DarkVeil speed={0.8} hueShift={280} />
        <div className="absolute inset-0 bg-black/40" />
      </div>
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
      <main className="flex-1 overflow-hidden">
        <ChatInterface />
      </main>
    </div>
  );
}

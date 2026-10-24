import { AuthForm } from "@/components/auth/AuthForm";

export const metadata = { title: "Log in — ViralFlow" };

export default function LoginPage() {
  return (
    <div className="flex h-screen w-screen">
      <div className="relative hidden h-full w-1/2 overflow-hidden md:block">
        <video
          className="h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-8 left-8 text-white">
          <p className="font-heading text-3xl font-semibold">ViralFlow</p>
          <p className="text-sm text-white/80">AI-powered social media content automation</p>
        </div>
      </div>

      <div className="flex h-full w-full items-center justify-center px-6 md:w-1/2">
        <AuthForm />
      </div>
    </div>
  );
}

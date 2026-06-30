import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { Noto_Sans_Sinhala } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const notoSinhala = Noto_Sans_Sinhala({
  subsets: ["sinhala"],
  variable: "--font-noto-sinhala",
  weight: ["400", "500", "600"],
  preload: false,
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  interactiveWidget: "resizes-content" as const,
};

export const metadata: Metadata = {
  title: "Kapruka Saama — AI Gift Concierge",
  description:
    "Sri Lanka's trilingual AI shopping agent. Speak Sinhala, Tanglish, or English — discover gifts and checkout on Kapruka.",
  openGraph: {
    title: "Kapruka Saama — AI Gift Concierge",
    description: "Trilingual AI gift concierge powered by Kapruka MCP",
    type: "website",
  },
};

const themeInitScript = `(function(){try{var t=localStorage.getItem("theme")||"system";var d=document.documentElement;var dark=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);d.classList.toggle("dark",dark);d.style.colorScheme=dark?"dark":"light"}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistMono.variable} ${notoSinhala.variable} ${GeistMono.className}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        <ThemeProvider>
          {children}
          <Toaster
            position="top-center"
            richColors
            toastOptions={{ className: "safe-top" }}
            offset={{ top: "max(1rem, env(safe-area-inset-top))" }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
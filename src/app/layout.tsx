import type { Metadata } from "next";
import { DM_Sans, Playfair_Display, Noto_Sans_Sinhala } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const notoSinhala = Noto_Sans_Sinhala({
  subsets: ["sinhala"],
  variable: "--font-noto-sinhala",
  weight: ["400", "500", "600"],
});

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${playfair.variable} ${notoSinhala.variable} antialiased`}>
        <ThemeProvider>
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
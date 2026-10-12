import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthInitializer } from "@/components/auth/auth-initializer";
import { ToastProvider } from "@/components/providers/toast-provider";
import { Providers } from "@/store/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SaadAgent",
  description: "Authentication with email and password plus OTP verification.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <ToastProvider>
            <AuthInitializer />
            {children}
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}

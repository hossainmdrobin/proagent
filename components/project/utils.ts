import { ProjectFile } from "./types";

export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function getFileName(path: string): string {
  return path.split("/").pop() || path;
}

export function getFileIcon(path: string): string {
  const name = getFileName(path);
  if (name.endsWith(".tsx") || name.endsWith(".ts")) return "📘";
  if (name.endsWith(".jsx") || name.endsWith(".js")) return "📗";
  if (name.endsWith(".css") || name.endsWith(".scss")) return "🎨";
  if (name.endsWith(".json")) return "📋";
  return "📄";
}

export function getLanguage(path: string): string {
  const name = getFileName(path);
  if (name.endsWith(".tsx") || name.endsWith(".ts")) return "typescript";
  if (name.endsWith(".jsx") || name.endsWith(".js")) return "javascript";
  if (name.endsWith(".css")) return "css";
  if (name.endsWith(".json")) return "json";
  return "plaintext";
}

export function getPreviewHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, sans-serif; }
  </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-indigo-900/50 via-purple-900/50 to-cyan-900/50 flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <div class="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 text-center">
      <div class="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      </div>
      <h1 class="text-3xl font-bold text-white mb-2">ProAgent Preview</h1>
      <p class="text-white/70 mb-6">Your Next.js project is running in the sandbox environment.</p>
      <div class="space-y-3">
        <button class="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all">
          Get Started
        </button>
        <button class="w-full border border-white/20 text-white/80 py-3 rounded-xl font-medium hover:bg-white/10 transition-all">
          View Documentation
        </button>
      </div>
    </div>
    <div class="mt-6 grid grid-cols-3 gap-3">
      <div class="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 text-center">
        <div class="text-2xl font-bold text-white">42</div>
        <div class="text-white/50 text-sm">Tests Passing</div>
      </div>
      <div class="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 text-center">
        <div class="text-2xl font-bold text-white">245KB</div>
        <div class="text-white/50 text-sm">Bundle Size</div>
      </div>
      <div class="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 text-center">
        <div class="text-2xl font-bold text-white">98</div>
        <div class="text-white/50 text-sm">Lighthouse Score</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export const DEFAULT_PROJECT_FILES: ProjectFile[] = [
  {
    path: "index.tsx",
    content: `import React from 'react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Button variant="primary" size="lg">
        Get Started
      </Button>
    </div>
  );
}`,
    sizeBytes: 0,
  },
  {
    path: "app/layout.tsx",
    content: `import type { Metadata } from 'next';
import { GeistSans, GeistMono } from 'next/font/google';
import './globals.css';

const geistSans = GeistSans({ subsets: ['latin'], variable: '--font-geist-sans' });
const geistMono = GeistMono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: 'ProAgent',
  description: 'AI-powered development platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={\`\${geistSans.variable} \${geistMono.variable} antialiased\`}>
      <body className="min-h-screen bg-background text-foreground">{children}</body>
    </html>
  );
}`,
    sizeBytes: 0,
  },
  {
    path: "components/ui/button.tsx",
    content: `import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "@/components/ui/spinner";

const variantClasses = {
  primary: "bg-zinc-900 text-white hover:bg-zinc-800",
  secondary: "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100",
  ghost: "text-zinc-700 hover:bg-zinc-100",
  danger: "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantClasses;
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {isLoading ? <Spinner className="size-4" label="Please wait" /> : null}
      {children}
    </button>
  );
}`,
    sizeBytes: 0,
  },
];
import type { Metadata } from "next";
import "./globals.css";
import { HsptsShell } from "@/components/hspts-shell";
import { AppProviders } from "@/components/app-providers";

export const metadata: Metadata = {
  title: "Holberton Student Performance Tracking System",
  description: "A modern education performance analytics dashboard for Holberton School.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <HsptsShell universityName="Holberton School">{children}</HsptsShell>
        </AppProviders>
      </body>
    </html>
  );
}

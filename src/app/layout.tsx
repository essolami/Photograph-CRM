import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "./globals.css";
import { ToastProvider } from "./toast";

export const metadata: Metadata = {
  title: "Luma — Gestion de studio",
  description: "Votre espace de gestion pour un studio photo organisé.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

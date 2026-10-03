import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "./globals.css";
import { ToastProvider } from "./toast";

export const metadata: Metadata = {
  title: "Graduation — Gestion de studio",
  description: "Votre espace de gestion pour un studio photo organisé.",
  icons: {
    icon: "/Graduation-logo.png",
    shortcut: "/Graduation-logo.png",
    apple: "/Graduation-logo.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      {/* Les extensions de navigateur ajoutent leurs attributs sur <body>
          avant l'hydratation (ColorZilla pose `cz-shortcut-listen`). On ignore
          ces écarts sur cet élément uniquement ; ses enfants restent vérifiés. */}
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

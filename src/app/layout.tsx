import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "./toast";

export const metadata: Metadata = {
  title: "Photographer CRM",
  description: "CRM for professional photographers",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

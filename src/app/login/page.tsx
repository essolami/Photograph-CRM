import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Brand } from "../sidebar";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-slate-950 p-12 lg:flex lg:flex-col lg:justify-between">
        <Brand />
        <div className="relative z-10 max-w-lg">
          <p className="text-sm font-semibold tracking-[.2em] text-indigo-400 uppercase">
            Your studio, organized
          </p>
          <h1 className="mt-5 text-5xl leading-tight font-bold tracking-tight text-white">
            Focus on the shot.
            <br />
            We’ll handle the rest.
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-400">
            Clients, bookings, projects and invoices in one secure workspace.
          </p>
        </div>
        <p className="text-sm text-slate-600">© 2026 LumaCRM</p>
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
      </section>
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <span className="text-xl font-bold text-slate-950">
              Luma<span className="text-indigo-600">CRM</span>
            </span>
          </div>
          <p className="text-sm font-semibold text-indigo-600">WELCOME BACK</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Sign in to your account
          </h2>
          <p className="mt-3 text-slate-500">
            Enter your credentials to access your workspace.
          </p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}

import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateUserForm } from "./create-user-form";
import { UserAccessForm } from "./user-access-form";

function AdminListLoading() {
  return (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-28 rounded-2xl border border-slate-200 bg-white" />
      ))}
    </div>
  );
}

async function AdminData({
  currentUser,
  searchParams,
}: {
  currentUser: Awaited<ReturnType<typeof requirePermission>>;
  searchParams: Promise<{ calendar?: string; count?: string }>;
}) {
  const [users, calendarConnection] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.googleCalendarConnection.findFirst(),
  ]);
  const query = await searchParams;
  return (
    <>
      <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3">
        <div>
          <p className="text-sm font-bold text-indigo-950">Google Calendar</p>
          <p className="text-xs text-indigo-700">
            {calendarConnection
              ? `Connecté à ${calendarConnection.email}`
              : "Ajoutez automatiquement les soutenances à votre calendrier."}
          </p>
        </div>
        <div className="flex gap-2">
          <a href={calendarConnection ? "/api/google/sync" : "/api/google/connect"} className="btn-secondary">
            {calendarConnection ? "Synchroniser les clients" : "Connecter Google Calendar"}
          </a>
          {calendarConnection && <a href="/api/google/connect" className="btn-secondary">Reconnecter</a>}
        </div>
      </section>
      {query.calendar === "not-configured" && (
        <p role="alert" className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          Google Calendar n’est pas configuré. Ajoutez GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans le fichier .env, puis redémarrez le serveur.
        </p>
      )}
      {query.calendar === "error" && (
        <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          La connexion Google Calendar a échoué. Vérifiez les identifiants OAuth et l’URI de redirection.
        </p>
      )}
      {query.calendar === "connected" && (
        <p role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Google Calendar est connecté.
        </p>
      )}
      {query.calendar === "synced" && (
        <p role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {query.count ?? "0"} client(s) synchronisé(s) avec Google Calendar.
        </p>
      )}
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold text-slate-950">
          Team members <span className="ml-1 text-sm font-normal text-slate-400">({users.length})</span>
        </h2>
        <div className="space-y-4">
          {users.map((user) => (
            <UserAccessForm key={user.id} user={user} isSelf={user.id === currentUser.id} />
          ))}
        </div>
      </section>
    </>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ calendar?: string; count?: string }>;
}) {
  const currentUser = await requirePermission("canManageUsers");
  return (
        <div className="max-w-6xl">
          <p className="text-sm font-semibold tracking-wide text-indigo-600">
            ADMINISTRATION
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Users & permissions
          </h1>
          <p className="mt-2 text-slate-500">
            Control who can access each part of your CRM.
          </p>
          <div className="mt-8">
            <CreateUserForm />
          </div>
          <Suspense fallback={<AdminListLoading />}>
            <AdminData currentUser={currentUser} searchParams={searchParams} />
          </Suspense>
        </div>
  );
}
import { Suspense } from "react";

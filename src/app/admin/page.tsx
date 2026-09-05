import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MobileHeader, Sidebar } from "../sidebar";
import { CreateUserForm } from "./create-user-form";
import { UserAccessForm } from "./user-access-form";

export default async function AdminPage() {
  const currentUser = await requirePermission("canManageUsers");
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <div className="flex min-h-screen">
      <Sidebar user={currentUser} activePage="admin" />
      <div className="min-w-0 flex-1">
        <MobileHeader />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
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
          <section className="mt-8">
            <h2 className="mb-4 text-lg font-bold text-slate-950">
              Team members{" "}
              <span className="ml-1 text-sm font-normal text-slate-400">
                ({users.length})
              </span>
            </h2>
            <div className="space-y-4">
              {users.map((user) => (
                <UserAccessForm
                  key={user.id}
                  user={user}
                  isSelf={user.id === currentUser.id}
                />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl p-8 sm:p-12">
      <h1 className="text-3xl font-semibold">Clients</h1>

      {clients.length === 0 ? (
        <p className="mt-6 text-zinc-600 dark:text-zinc-400">
          No clients found. Run the database seed command to add test clients.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-100 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {clients.map((client) => (
                <tr key={client.id}>
                  <td className="px-4 py-3">{client.name}</td>
                  <td className="px-4 py-3">{client.email}</td>
                  <td className="px-4 py-3">{client.phone ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

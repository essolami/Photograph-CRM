import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { googleAuthorizationUrl } from "@/lib/google-calendar";

export async function GET() {
  await requirePermission("canManageUsers");
  const state = randomBytes(24).toString("hex");
  (await cookies()).set("google_calendar_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  let authorizationUrl: string;
  try {
    authorizationUrl = googleAuthorizationUrl(state);
  } catch (error) {
    console.error("Google Calendar connection is not configured", error);
    redirect("/admin?calendar=not-configured");
  }
  redirect(authorizationUrl!);
}

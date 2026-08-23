import { NextResponse } from "next/server";

// POST /age-gate — set the long-lived age cookie and return to origin path.
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const target = typeof form?.get("returnTo") === "string" ? String(form.get("returnTo")) : "/";
  const safeTarget = target.startsWith("/") && !target.startsWith("//") ? target : "/";
  const res = NextResponse.redirect(new URL(safeTarget, req.url), 303);
  res.cookies.set("age_confirmed", "1", { maxAge: 31536000, path: "/", sameSite: "lax", httpOnly: false });
  return res;
}

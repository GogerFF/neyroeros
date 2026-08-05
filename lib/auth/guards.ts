import { redirect } from "next/navigation"; import { auth } from "@/auth";
export async function requireUser(){const s=await auth();if(!s?.user)redirect("/login");return s.user}
export async function requireAdmin(){const u=await requireUser();if(!["ADMIN","MODERATOR"].includes(u.role))redirect("/");return u}

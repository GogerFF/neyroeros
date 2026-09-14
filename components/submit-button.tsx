"use client";
import { useFormStatus } from "react-dom";

export function SubmitButton({ children, className, pendingLabel }: { children: React.ReactNode; className?: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return <button className={className} disabled={pending} aria-busy={pending}>{pending && pendingLabel ? pendingLabel : children}</button>;
}

"use client";
import { useFormStatus } from "react-dom";

export function SubmitButton({ children, className, pendingLabel, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return <button className={className} disabled={pending} aria-busy={pending} {...rest}>{pending && pendingLabel ? pendingLabel : children}</button>;
}

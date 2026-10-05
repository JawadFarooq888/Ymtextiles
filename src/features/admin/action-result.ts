import type { ZodError } from "zod";

export type ActionResult<T = undefined> =
  { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export function ok(): ActionResult<undefined>;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

export function fail(error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

export function fromZodError(error: ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  const first = error.issues[0];
  const where = first?.path.length ? `${first.path.join(".")}: ` : "";
  return fail(`${where}${first?.message ?? "Invalid input"}`, fieldErrors);
}

/** An error whose message is safe and helpful to show to the admin. */
export class UserError extends Error {}

/** Map known Prisma errors to friendly messages; never leak internals to the browser. */
export function fromUnknownError(error: unknown, context: string): ActionResult<never> {
  if (error instanceof UserError) return fail(error.message);
  if (typeof error === "object" && error && "code" in error) {
    const code = (error as { code?: string }).code;
    const target = (error as { meta?: { target?: string[] | string } }).meta?.target;
    if (code === "P2002") {
      const field = Array.isArray(target) ? target.join(", ") : (target ?? "value");
      return fail(`That ${field} is already in use. Please choose another.`);
    }
    if (code === "P2003") {
      return fail("This item is still in use elsewhere, so it cannot be removed.");
    }
    if (code === "P2025") {
      return fail("This item no longer exists. Refresh the page and try again.");
    }
  }
  console.error(`[admin] ${context} failed`, error);
  return fail("Something went wrong. Please try again.");
}

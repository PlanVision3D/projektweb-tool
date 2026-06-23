import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getSessionCustomer } from "@/lib/db";
import type { Customer } from "@/types/content";

export const SESSION_COOKIE = "pw_kunde";

/** Passwort mit zufälligem Salt hashen -> "salt:hash" (scrypt). */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = scryptSync(password, salt, 64);
  const orig = Buffer.from(hash, "hex");
  return orig.length === test.length && timingSafeEqual(orig, test);
}

/** Aktuell eingeloggten Kunden aus dem Session-Cookie ermitteln (Server). */
export async function currentCustomer(): Promise<Customer | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return getSessionCustomer(token);
}

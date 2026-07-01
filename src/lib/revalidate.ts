import { revalidatePath } from "next/cache";
import { normalizeDomain } from "./db";

/**
 * Erneuert den ISR-Cache aller öffentlichen Seiten eines Projekts – Slug-Route
 * und (falls vorhanden) die eigene Domain (apex + www).
 *
 * Muss aus einem Route-Handler / einer Server-Action heraus aufgerufen werden.
 * Aufrufen bei jeder Änderung, die die Live-Seite betrifft: Veröffentlichen,
 * Löschen, Domain-Wechsel.
 */
export function revalidateProjectPaths(slug?: string, customDomain?: string): void {
  if (slug) {
    revalidatePath(`/site/${slug}`);
    revalidatePath(`/site/${slug}/anfrage`);
  }
  if (customDomain) {
    const d = normalizeDomain(customDomain);
    // Die Middleware routet nach dem tatsächlichen Host – beide Varianten abdecken
    for (const host of [d, `www.${d}`]) {
      revalidatePath(`/domains/${host}`);
      revalidatePath(`/domains/${host}/anfrage`);
    }
  }
}

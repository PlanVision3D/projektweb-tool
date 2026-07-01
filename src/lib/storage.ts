import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

/**
 * UPLOAD-/MEDIEN-SCHICHT
 * ----------------------
 * Jedes hochgeladene Bild wird ZUERST komprimiert (sharp) und DANN gespeichert.
 * Zwei austauschbare Backends, automatisch gewählt – analog zur DB-Schicht:
 *
 *  • PRODUKTION (R2-Env gesetzt): Upload zu Cloudflare R2. Die öffentliche Seite
 *    lädt die Bilder direkt von R2 → kein Vercel-Bandbreitenverbrauch (0 € Egress).
 *  • LOKAL (keine R2-Env): Schreiben nach public/uploads/… wie bisher – läuft
 *    sofort zum Entwickeln, ebenfalls bereits komprimiert.
 *
 * Die App spricht nur über `storeUpload()` mit dieser Schicht.
 */

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET;
// Öffentliche Basis-URL des Buckets (r2.dev-Domain oder eigene CDN-Domain), ohne Slash am Ende
const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/+$/, "");

export const usingR2 = !!(accountId && accessKeyId && secretAccessKey && bucket && publicUrl);

const s3: S3Client | null = usingR2
  ? new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
    })
  : null;

/* ===================================================================== */
/*  Kompression                                                           */
/* ===================================================================== */

const MAX_WIDTH = 1920; // größere Bilder werden runterskaliert (kein Upscaling)
const WEBP_QUALITY = 80; // visuell praktisch verlustfrei, ~70–90 % kleiner als PNG
const RASTER = new Set([".png", ".jpg", ".jpeg", ".webp"]);

interface Processed {
  buffer: Buffer;
  ext: string;
  contentType: string;
}

/**
 * Raster-Fotos → WebP (skaliert + komprimiert). SVG/GIF bleiben unverändert
 * (Vektor bzw. Animation würden bei der Umwandlung kaputtgehen).
 */
async function processImage(input: Buffer, ext: string): Promise<Processed> {
  if (RASTER.has(ext)) {
    const buffer = await sharp(input)
      .rotate() // EXIF-Orientierung anwenden, dann Metadaten verwerfen
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    return { buffer, ext: ".webp", contentType: "image/webp" };
  }
  if (ext === ".svg") return { buffer: input, ext: ".svg", contentType: "image/svg+xml" };
  if (ext === ".gif") return { buffer: input, ext: ".gif", contentType: "image/gif" };
  return { buffer: input, ext: ext || ".bin", contentType: "application/octet-stream" };
}

/* ===================================================================== */
/*  Speichern                                                             */
/* ===================================================================== */

const CACHE_CONTROL = "public, max-age=31536000, immutable"; // Dateinamen sind UUIDs → dauerhaft cachebar

/**
 * Komprimiert ein hochgeladenes Bild und speichert es im aktiven Backend.
 * Gibt die fertige URL zurück (absolut bei R2, relativ `/uploads/…` lokal).
 */
export async function storeUpload(projectId: string, file: File): Promise<string> {
  const input = Buffer.from(await file.arrayBuffer());
  const ext = (path.extname(file.name) || ".png").toLowerCase();
  const { buffer, ext: outExt, contentType } = await processImage(input, ext);
  const key = `uploads/${projectId}/${randomUUID()}${outExt}`;

  if (usingR2 && s3) {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket!,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: CACHE_CONTROL,
      })
    );
    return `${publicUrl}/${key}`;
  }

  // Lokaler Fallback (Entwicklung)
  const fullPath = path.join(process.cwd(), "public", key);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, buffer);
  return `/${key}`;
}

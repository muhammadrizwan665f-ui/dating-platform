import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

const client = new S3Client({
  region: "auto",
  endpoint: process.env.STORAGE_URL,
  credentials: {
    accessKeyId: process.env.STORAGE_KEY ?? "",
    secretAccessKey: process.env.STORAGE_SECRET ?? "",
  },
});

export class UnsupportedFileTypeError extends Error {}
export class FileTooLargeError extends Error {}

/**
 * Returns a short-lived presigned PUT URL for direct browser upload.
 * The browser never receives storage credentials, and validation happens
 * both here (type) and again on the actual object once uploaded (phase 8:
 * moderation worker re-checks stored file signature, not just extension).
 */
export async function getUploadUrl(contentType: string, sizeBytes: number, prefix: string) {
  if (!ALLOWED_MIME.has(contentType)) throw new UnsupportedFileTypeError(contentType);
  if (sizeBytes > MAX_BYTES) throw new FileTooLargeError(String(sizeBytes));

  const key = `${prefix}/${randomUUID()}`;
  const command = new PutObjectCommand({
    Bucket: process.env.STORAGE_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  const url = await getSignedUrl(client, command, { expiresIn: 60 });
  return { uploadUrl: url, key };
}

/**
 * Uploads a file's bytes directly from server-side code (no browser-to-R2
 * hop, so no R2 bucket CORS configuration is required). Preferred over
 * getUploadUrl()'s direct-PUT flow for this app since we don't control
 * whether the R2 bucket has CORS enabled for this origin.
 */
export async function uploadBuffer(buffer: Buffer, contentType: string, prefix: string) {
  if (!ALLOWED_MIME.has(contentType)) throw new UnsupportedFileTypeError(contentType);
  if (buffer.byteLength > MAX_BYTES) throw new FileTooLargeError(String(buffer.byteLength));

  const key = `${prefix}/${randomUUID()}`;
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.STORAGE_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return { key };
}

export function publicUrlFor(key: string) {
  return `${process.env.STORAGE_PUBLIC_BASE}/${key}`;
}

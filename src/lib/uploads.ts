import path from "path";

/**
 * Directory where uploaded files (currently payment proofs) are stored.
 *
 * Note: On Vercel (serverless), local filesystem is ephemeral.
 * For production, replace this with S3/Cloudinary implementation.
 */
export function uploadDir(): string {
  // Static path literal that Turbopack can trace at build time
  // Relative to project root: /uploads
  return path.resolve("uploads");
}
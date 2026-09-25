import path from "path";

/**
 * Directory where uploaded files (currently payment proofs) are stored.
 *
 * Defaults to `<cwd>/uploads` so files survive restarts on a self-hosted
 * deployment; set UPLOAD_DIR to relocate it (or swap this module for S3 /
 * Cloudinary when running serverless).
 */
export function uploadDir(): string {
  // Use a static, traceable path for Turbopack
  // In production/Vercel, set UPLOAD_DIR env var to a static path
  const baseDir = process.env.UPLOAD_DIR || "uploads";
  // Return absolute path for fs operations
  return path.resolve(baseDir);
}

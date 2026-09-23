import path from "path";

/**
 * Directory where uploaded files (currently payment proofs) are stored.
 *
 * Defaults to `<cwd>/uploads` so files survive restarts on a self-hosted
 * deployment; set UPLOAD_DIR to relocate it (or swap this module for S3 /
 * Cloudinary when running serverless).
 */
export function uploadDir(): string {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
}

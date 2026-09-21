import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { resolve } from "path";

try {
  const hash = execSync("git rev-parse --short HEAD").toString().trim();
  const version = {
    buildId: hash,
    timestamp: Date.now(),
  };
  
  const outputPath = resolve(process.cwd(), "public/version.json");
  writeFileSync(outputPath, JSON.stringify(version, null, 2));
  console.log(`Generated version.json: ${JSON.stringify(version)}`);
} catch (error) {
  console.error("Failed to generate version.json:", error);
  // Write fallback
  const version = {
    buildId: Date.now().toString(),
    timestamp: Date.now(),
  };
  const outputPath = resolve(process.cwd(), "public/version.json");
  writeFileSync(outputPath, JSON.stringify(version, null, 2));
}
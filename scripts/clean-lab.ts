import fs from "node:fs";
import path from "node:path";

const labDir = path.join(import.meta.dirname, "..", "lab");

if (fs.existsSync(labDir)) {
  fs.rmSync(labDir, { recursive: true });
}
fs.mkdirSync(labDir, { recursive: true });

console.log("lab folder cleaned");

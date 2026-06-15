import crypto from "node:crypto";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const rl = readline.createInterface({ input, output });
const password = await rl.question("Admin password to hash: ");
rl.close();

if (!password || password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const iterations = 310000;
const salt = crypto.randomBytes(16).toString("base64url");
const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("base64url");

console.log(`pbkdf2_sha256$${iterations}$${salt}$${hash}`);

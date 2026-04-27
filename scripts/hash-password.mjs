import { pbkdf2Sync, randomBytes } from "node:crypto";
import { argv } from "node:process";

const password = argv[2];

if (!password) {
  console.error("Usage: npm run hash-password -- <password>");
  process.exit(1);
}

const iterations = 310000;
const salt = randomBytes(16).toString("base64url");
const hash = pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("base64url");

console.log(`pbkdf2.${iterations}.${salt}.${hash}`);

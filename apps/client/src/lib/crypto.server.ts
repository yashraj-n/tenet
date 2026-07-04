import crypto from "node:crypto";

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET;

export function encrypt(text: string): { encryptedData: string; iv: string; salt: string } {
  if (!ENCRYPTION_SECRET) {
    throw new Error("ENCRYPTION_SECRET is not set in the environment variables");
  }

  const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(ENCRYPTION_SECRET, salt, 100000, 32, "sha256");
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return {
    encryptedData: encrypted,
    iv: iv.toString("hex"),
    salt: salt.toString("hex"),
  };
}

export function decrypt(encryptedData: string, ivHex: string, saltHex: string): string {
  if (!ENCRYPTION_SECRET) {
    throw new Error("ENCRYPTION_SECRET is not set in the environment variables");
  }

  const salt = Buffer.from(saltHex, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const key = crypto.pbkdf2Sync(ENCRYPTION_SECRET, salt, 100000, 32, "sha256");

  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

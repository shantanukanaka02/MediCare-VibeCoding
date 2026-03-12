import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import { env } from "../../config/env";

const KEY = Buffer.from(env.ENCRYPTION_KEY, "utf8").subarray(0, 32);
const IV_LENGTH = 12;

export const encryptField = (plainText: string): string => {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
};

export const decryptField = (cipherText: string): string => {
  const [ivHex, tagHex, encryptedHex] = cipherText.split(":");
  const decipher = createDecipheriv("aes-256-gcm", KEY, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedHex, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
};
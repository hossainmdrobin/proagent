import "server-only";

import bcrypt from "bcrypt";
import { getServerEnv } from "@/lib/env";

export async function hashPassword(password: string): Promise<string> {
  const { BCRYPT_ROUNDS } = getServerEnv();
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

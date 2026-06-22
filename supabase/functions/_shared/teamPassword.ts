import bcrypt from "npm:bcryptjs@2.4.3";

const ROUNDS = 10;

export async function hashTeamPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS);
}

export async function verifyTeamPassword(password: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

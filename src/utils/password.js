import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;

export async function hashPassword(password) {
  return await bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

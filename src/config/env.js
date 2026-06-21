import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().transform(Number).default("3000"),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(32),
  SESSION_TTL: z.string().transform(Number).default("86400"),
  BCRYPT_SALT_ROUNDS: z.string().transform(Number).default("12"),
});

export const env = envSchema.parse(process.env);

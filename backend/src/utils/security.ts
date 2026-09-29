import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AuthTokenPayload } from '../types/index.js';

const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (payload: AuthTokenPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): AuthTokenPayload => {
  return jwt.verify(token, config.jwt.secret) as AuthTokenPayload;
};

export const generateEmployeeId = (sequenceNumber: number): string => {
  return `HF-EMP-${sequenceNumber.toString().padStart(4, '0')}`;
};

export const getEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

export const JWT_SECRET = getEnvVar('JWT_SECRET');
export const DATABASE_URL = getEnvVar('DATABASE_URL');
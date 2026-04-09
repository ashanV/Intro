import { SignJWT, jwtVerify } from 'jose';

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length === 0) {
    throw new Error('JWT_SECRET is not set in environment variables');
  }
  return secret;
};

export const verifyAuth = async (token: string) => {
  try {
    const verified = await jwtVerify(
      token,
      new TextEncoder().encode(getJwtSecretKey())
    );
    return verified.payload;
  } catch (err) {
    throw new Error('Your token has expired or is invalid');
  }
};

export const createToken = async (payload: { userId: string; username: string }) => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(new TextEncoder().encode(getJwtSecretKey()));
};

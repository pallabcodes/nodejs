import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const privateKeyPath = path.resolve('src/config/keys/private.pem');
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

export function decryptWithPrivateKey(encryptedBase64) {
  const buffer = Buffer.from(encryptedBase64, 'base64');
  return crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    buffer
  ).toString('utf8');
}
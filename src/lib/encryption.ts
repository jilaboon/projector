import CryptoJS from 'crypto-js';

const getEncryptionKey = (): string => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  return key;
};

export function encrypt(text: string): string {
  if (!text) return text;
  const key = getEncryptionKey();
  return CryptoJS.AES.encrypt(text, key).toString();
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return encryptedText;
  try {
    const key = getEncryptionKey();
    const bytes = CryptoJS.AES.decrypt(encryptedText, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return encryptedText;
  }
}

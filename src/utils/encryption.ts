import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly SALT_LENGTH = 64;
  private static readonly TAG_LENGTH = 16;

  /**
   * Encrypt sensitive data using AES-256-GCM
   */
  static async encrypt(text: string, secretKey: string): Promise<string> {
    try {
      // Generate a random salt
      const salt = randomBytes(this.SALT_LENGTH);
      
      // Derive a key from the secret key and salt
      const key = await scryptAsync(secretKey, salt, this.KEY_LENGTH) as Buffer;
      
      // Generate a random IV
      const iv = randomBytes(this.IV_LENGTH);
      
      // Create cipher
      const cipher = createCipheriv(this.ALGORITHM, key, iv);
      
      // Encrypt the text
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get the auth tag
      const tag = cipher.getAuthTag();
      
      // Combine salt + iv + tag + encrypted data
      const result = salt.toString('hex') + ':' + iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
      
      return result;
    } catch (error) {
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt sensitive data using AES-256-GCM
   */
  static async decrypt(encryptedData: string, secretKey: string): Promise<string> {
    try {
      // Split the encrypted data
      const parts = encryptedData.split(':');
      if (parts.length !== 4) {
        throw new Error('Invalid encrypted data format');
      }
      
      const [saltHex, ivHex, tagHex, encrypted] = parts;
      
      // Convert hex strings back to buffers
      const salt = Buffer.from(saltHex, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');
      
      // Derive the key
      const key = await scryptAsync(secretKey, salt, this.KEY_LENGTH) as Buffer;
      
      // Create decipher
      const decipher = createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(tag);
      
      // Decrypt
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed');
    }
  }
} 
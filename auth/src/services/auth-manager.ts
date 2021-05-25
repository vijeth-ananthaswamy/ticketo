import { randomBytes, scrypt } from 'crypto';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export class AuthManager {
  static async hashPassword(password: string) {
    const salt = randomBytes(8).toString('hex');
    const buffer = (await scryptAsync(password, salt, 64)) as Buffer;

    return `${buffer.toString('hex')}.${salt}`;
  }

  static async comparePasswords(storedPwd: string, suppliedPwd: string) {
    const [hashedPwd, salt] = storedPwd.split('.');
    const buffer = (await scryptAsync(suppliedPwd, salt, 64)) as Buffer;

    return buffer.toString('hex') === hashedPwd;
  }

  static generateAuthToken(userId: string, email: string) {
    // secret key to sign JWT(JWT_KEY) 'mY-$uPeR#DupER#hYpeR#buMPer-$PeCi@l-$ecRET-kEy123#'
    return jwt.sign(
      {
        id: userId,
        email: email,
      },
      process.env.JWT_KEY!
    );
  }

  static verifyAuthToken(authToken: string) {
    try {
      const payload = jwt.verify(authToken, process.env.JWT_KEY!);
      console.log('Auth Token verified successfully....');
      return payload;
    } catch (error) {
      console.log('Could not verify Auth Token....');
      return null;
    }
  }
}

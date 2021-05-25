import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { BadRequestError, validateRequest } from '@ticketo/common';

import { User } from '../models/user';
import { AuthManager } from '../services/auth-manager';

const router = express.Router();

const validator = [
  body('email').trim().isEmail().withMessage('Email must be valid'),
  body('password').trim().notEmpty().withMessage('Password cannot be empty'),
];

router.post(
  '/api/users/signin',
  validator,
  validateRequest,
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      throw new BadRequestError('User not found');
    }

    const passwordsMatch = await AuthManager.comparePasswords(
      existingUser.password,
      password
    );

    if (!passwordsMatch) {
      throw new BadRequestError('Invalid credentials');
    }

    //Generate JWT
    const authToken = AuthManager.generateAuthToken(
      existingUser.id,
      existingUser.email
    );

    //Store JWT in session
    req.session = {
      jwt: authToken,
    };

    console.log('Login successful...');
    res.status(200).send(existingUser);
  }
);

export { router as signinRouter };

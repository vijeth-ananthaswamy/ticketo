import express, { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { BadRequestError, validateRequest } from '@ticketo/common';

import { User } from '../models/user';
import { AuthManager } from '../services/auth-manager';

const router = express.Router();

const validationRules = [
  body('email').trim().isEmail().withMessage('Email must be valid'),
  body('password')
    .trim()
    .isLength({ min: 4, max: 20 })
    .withMessage('Password must be of 4-20 characters'),
];

router.post(
  '/api/users/signup',
  validationRules,
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log('User exists');
      throw new BadRequestError('Email already in use');
    }

    const user = User.build({ email, password });
    await user.save();
    console.log('User created', user);

    //Generate JWT using AuthManager class
    const authToken = AuthManager.generateAuthToken(user.id, user.email);

    //Store in session
    req.session = {
      jwt: authToken,
    };

    console.log('Signup successful...');
    res.status(201).send(user);
  }
);

export { router as signupRouter };

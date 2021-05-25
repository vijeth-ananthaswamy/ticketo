import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app';

declare global {
  namespace NodeJS {
    interface Global {
      signin(id?: string): string[];
    }
  }
}

let mongo: any;

jest.mock('../nats-wrapper');

process.env.STRIPE_KEY =
  'sk_test_51ICEJtF3sX0bihblr1ZCwNqmATqlrQbnqXKzwIGmlJCvIa0IyKSwe1LEmw2i0gQZuaU8WdNSvpWDGdM2mlmA4F1I00tw6P2PX5';

beforeAll(async () => {
  process.env.JWT_KEY = 'testkey';
  mongo = new MongoMemoryServer();
  const mongoUri = await mongo.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}, 120000);

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();
  jest.clearAllMocks();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
}, 120000);

afterAll(async () => {
  await mongo.stop();
  await mongoose.connection.close();
}, 120000);

global.signin = (id?: string) => {
  // Build a JWT payload {id, email}
  const payload = {
    id: id || new mongoose.Types.ObjectId().toHexString(),
    email: 'test@test.com',
  };

  //Create a JWT
  const token = jwt.sign(payload, process.env.JWT_KEY!);

  //Build session object {jwt: MY_JWT}
  const session = { jwt: token };

  // Convert that session into JSON
  const sessionAsJSON = JSON.stringify(session);

  //Encode the JSON to base64
  const base64 = Buffer.from(sessionAsJSON).toString('base64');

  // Return a string - cookie with the encoded data
  return [`express:sess=${base64}`];
};

import request from 'supertest';
import mongoose from 'mongoose';

import { app } from '../../app';
import { Order } from '../../models/order';
import { OrderStatus } from '@ticketo/common';
import { stripe } from '../../stripe';
import { Payment } from '../../models/payments';

//This is used for mocked stripe test
// jest.mock('../../stripe');

it('returns a 404 when purchasing an order that does not exist', async () => {
  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin())
    .send({ token: 'aaaa', orderId: mongoose.Types.ObjectId().toHexString() })
    .expect(404);
});

it('returns a 401 when purchasing an order that does not belong to the user', async () => {
  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    version: 0,
    userId: mongoose.Types.ObjectId().toHexString(),
    price: 100,
    status: OrderStatus.Created,
  });

  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin())
    .send({ token: 'aaaa', orderId: order.id })
    .expect(401);
});

it('returns a 400 when purchasing a cancelled order', async () => {
  const userId = mongoose.Types.ObjectId().toHexString();
  const id = mongoose.Types.ObjectId().toHexString();

  const order = Order.build({
    id,
    userId,
    version: 0,
    price: 100,
    status: OrderStatus.Cancelled,
  });

  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin(userId))
    .send({ token: 'aaa', orderId: id })
    .expect(400);
});

// The below test is implemented using a mock stripe api

// it('returns a 204 when payment is successful', async () => {
//   const userId = mongoose.Types.ObjectId().toHexString();
//   const id = mongoose.Types.ObjectId().toHexString();

//   const price = Math.floor(Math.random() * 100000);

//   const order = Order.build({
//     id,
//     userId,
//     version: 0,
//     price,
//     status: OrderStatus.Created,
//   });

//   await order.save();

//   await request(app)
//     .post('/api/payments')
//     .set('Cookie', global.signin(userId))
//     .send({ token: 'tok_visa', orderId: id })
//     .expect(201);

//   expect(stripe.charges.create).toHaveBeenCalled();

//   const chargeOptions = (stripe.charges.create as jest.Mock).mock.calls[0][0];

//   expect(chargeOptions.source).toEqual('tok_visa');
//   expect(chargeOptions.amount).toEqual(100 * 100);
//   expect(chargeOptions.currency).toEqual('usd');
// });

it('returns a 204 when payment is successful', async () => {
  const userId = mongoose.Types.ObjectId().toHexString();
  const id = mongoose.Types.ObjectId().toHexString();

  const price = Math.floor(Math.random() * 100000);

  const order = Order.build({
    id,
    userId,
    version: 0,
    price,
    status: OrderStatus.Created,
  });

  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin(userId))
    .send({ token: 'tok_visa', orderId: id })
    .expect(201);

  expect(stripe.charges.create).toHaveBeenCalled();

  const stripeCharges = await stripe.charges.list({ limit: 50 });
  const stripeCharge = stripeCharges.data.find((charge) => {
    return charge.amount === price * 100;
  });

  expect(stripeCharge).toBeDefined();
  expect(stripeCharge!.currency).toEqual('usd');

  const payment = await Payment.findOne({
    orderId: order.id,
    stripeId: stripeCharge!.id,
  });

  expect(payment).not.toBeNull();
});

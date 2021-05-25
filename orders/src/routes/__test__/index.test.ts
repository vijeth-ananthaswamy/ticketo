import request from 'supertest';
import mongoose from 'mongoose';

import { app } from '../../app';
import { Order } from '../../models/order';
import { Ticket } from '../../models/ticket';

const createTicket = async () => {
  const ticket = Ticket.build({
    id: mongoose.Types.ObjectId().toHexString(),
    title: 'Concert',
    price: 100,
  });

  await ticket.save();
  return ticket;
};

it('fetches orders for a particular user', async () => {
  //Create three tickets
  const ticketOne = await createTicket();
  const ticketTwo = await createTicket();
  const ticketThree = await createTicket();

  const userOneCookie = global.signin();
  const userTwoCookie = global.signin();

  // Create one order for User #1
  await request(app)
    .post('/api/orders')
    .set('Cookie', userOneCookie)
    .send({ ticketId: ticketOne.id })
    .expect(201);

  //Create two orders for User #2
  const { body: orderOne } = await request(app)
    .post('/api/orders')
    .set('Cookie', userTwoCookie)
    .send({ ticketId: ticketTwo.id })
    .expect(201);

  console.log('Order one ', orderOne);

  const { body: orderTwo } = await request(app)
    .post('/api/orders')
    .set('Cookie', userTwoCookie)
    .send({ ticketId: ticketThree.id })
    .expect(201);
  //Make a request to get the orders for User #2

  const response = await request(app)
    .get('/api/orders')
    .set('Cookie', userTwoCookie)
    .expect(200);

  console.log(response.body);
  //Make sure we only got the orders for User #2
  expect(response.body.length).toEqual(2);
  expect(response.body[0].id).toEqual(orderOne.id);
  expect(response.body[1].id).toEqual(orderTwo.id);
  expect(response.body[0].ticket.id).toEqual(ticketTwo.id);
  expect(response.body[1].ticket.id).toEqual(ticketThree.id);
});

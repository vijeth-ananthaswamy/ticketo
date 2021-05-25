import request from 'supertest';
import { app } from '../../app';
import mongoose from 'mongoose';
import { natsWrapper } from '../../nats-wrapper';
import { Ticket } from '../../models/ticket';

it('returns a 401 if user is not authenticated', async () => {
  const res = await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({ title: 'Test', price: 10 });

  console.log(res.body.id);

  await request(app)
    .put(`/api/tickets/${res.body.id}`)
    .send({ title: 'Test', price: 10 })
    .expect(401);
});

it('returns a 404 if provided ticketid does not exist', async () => {
  const id = new mongoose.Types.ObjectId().toHexString();
  await request(app)
    .put(`/api/tickets/${id}`)
    .set('Cookie', global.signin())
    .send({ title: 'Test', price: 10 })
    .expect(404);
});

it('returns a 401 if user does not own the ticket', async () => {
  const res = await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({ title: 'Test', price: 10 });

  const id = res.body.id;
  console.log('ID of ticket --- ', id);
  await request(app)
    .put(`/api/tickets/${id}`)
    .set('Cookie', global.signin())
    .send({ title: 'Testing', price: 25 })
    .expect(401);
});

it('returns a 400 if invalid title or price provided', async () => {
  const cookie = global.signin();

  const res = await request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({ title: 'Test', price: 10 });

  await request(app)
    .put(`/api/tickets/${res.body.id}`)
    .set('Cookie', cookie)
    .send({ title: '', price: 25 })
    .expect(400);

  await request(app)
    .put(`/api/tickets/${res.body.id}`)
    .set('Cookie', cookie)
    .send({ title: 'Testing', price: -25 })
    .expect(400);
});

it('returns a 200 if for a valid request and updates the ticket in the db', async () => {
  const cookie = global.signin();
  const res = await request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({ title: 'Test', price: 10 });

  const updateTicketRes = await request(app)
    .put(`/api/tickets/${res.body.id}`)
    .set('Cookie', cookie)
    .send({ title: 'Testing', price: 25 })
    .expect(200);

  const fetchTicketRes = await request(app)
    .get(`/api/tickets/${res.body.id}`)
    .send();

  expect(fetchTicketRes.body.title).toEqual('Testing');
  expect(fetchTicketRes.body.price).toEqual(25);
});

it('publishes an event when a ticket is updated', async () => {
  const cookie = global.signin();
  const res = await request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({ title: 'Test', price: 10 });

  const updateTicketRes = await request(app)
    .put(`/api/tickets/${res.body.id}`)
    .set('Cookie', cookie)
    .send({ title: 'Testing', price: 25 })
    .expect(200);
  expect(natsWrapper.client.publish).toHaveBeenCalledTimes(2);
});

it('throws an error while editing an already reserved ticket', async () => {
  const cookie = global.signin();
  const orderId = mongoose.Types.ObjectId().toHexString();
  const res = await request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({ title: 'Test', price: 10 });

  const ticket = await Ticket.findById(res.body.id);
  ticket!.set({ orderId });
  await ticket!.save();

  const updateTicketresponse = request(app)
    .put(`/api/tickets/${res.body.id}`)
    .set('Cookie', cookie)
    .send({ title: 'NewTest', price: 50 })
    .expect(400);
});

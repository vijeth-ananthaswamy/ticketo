import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';

it('returns a 404 if a ticket is not found', async () => {
  const randomTicketId = new mongoose.Types.ObjectId().toHexString();
  console.log('Id is :', randomTicketId);
  await request(app).get(`/api/tickets/${randomTicketId}`).send().expect(404);
});

it('returns a ticket if found', async () => {
  const title = 'Concert';
  const price = 20;
  const res = await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({ title, price })
    .expect(201);

  const ticketRes = await request(app)
    .get(`/api/tickets/${res.body.id}`)
    .send()
    .expect(200);

  expect(ticketRes.body.title).toEqual(title);
  expect(ticketRes.body.price).toEqual(price);
});

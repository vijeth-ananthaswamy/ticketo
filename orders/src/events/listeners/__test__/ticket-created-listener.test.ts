import { TicketCreatedEvent } from '@ticketo/common';
import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';

import { TicketCreatedListener } from '../ticket-created-listener';
import { natsWrapper } from '../../../nats-wrapper';
import { Ticket } from '../../../models/ticket';

const setup = async () => {
  //Create a listener instance
  const listener = new TicketCreatedListener(natsWrapper.client);
  //Create a fake data event
  const data: TicketCreatedEvent['data'] = {
    version: 0,
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'Concert',
    price: 188,
    userId: new mongoose.Types.ObjectId().toHexString(),
  };

  //Create a fake message object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, data, msg };
};

it('creates and saves a ticket', async () => {
  //Call the onMessage() function
  const { listener, data, msg } = await setup();
  await listener.onMessage(data, msg);

  //Assert to make sure ticket was created
  const ticket = await Ticket.findById(data.id);
  expect(ticket).toBeDefined();
  expect(ticket!.title).toEqual(data.title);
  expect(ticket!.price).toEqual(data.price);
});

it('acknowledges the message', async () => {
  //Call the onMessage() function
  const { listener, data, msg } = await setup();
  await listener.onMessage(data, msg);

  //Assert to make sure ack() method was created
  expect(msg.ack).toHaveBeenCalled();
});

import { TicketUpdatedEvent } from '@ticketo/common';
import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';

import { TicketUpdatedListener } from '../ticket-updated-listener';
import { natsWrapper } from '../../../nats-wrapper';
import { Ticket } from '../../../models/ticket';

const setup = async () => {
  // Create a listener
  const listener = new TicketUpdatedListener(natsWrapper.client);
  //Create and save a ticket
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'Concert',
    price: 188,
  });
  await ticket.save();

  //Create a fake message and data object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  const data: TicketUpdatedEvent['data'] = {
    id: ticket.id,
    version: ticket.version + 1,
    title: 'Cricket',
    price: 200,
    userId: new mongoose.Types.ObjectId().toHexString(),
  };

  return { listener, data, msg, ticket };
};

it('updates the ticket from the ticket updated event', async () => {
  const { listener, data, msg, ticket } = await setup();
  await listener.onMessage(data, msg);

  const ticketUpdated = await Ticket.findById(ticket.id);
  expect(ticketUpdated!.title).toEqual(data.title);
  expect(ticketUpdated!.price).toEqual(data.price);
  expect(ticketUpdated!.version).toEqual(data.version);
});

it('acknowledges the message', async () => {
  const { listener, data, msg } = await setup();
  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();
});

it('does not call ack if version number is wrong', async () => {
  const { msg, data, listener, ticket } = await setup();
  data.version = 100;

  try {
    await listener.onMessage(data, msg);
  } catch (err) {
  }

  expect(msg.ack).not.toHaveBeenCalled();
});

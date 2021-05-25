import { Message } from 'node-nats-streaming';
import mongoose from 'mongoose';

import { OrderCreatedListener } from '../../listeners/order-created-listener';
import { OrderCreatedEvent, OrderStatus } from '@ticketo/common';
import { natsWrapper } from '../../../nats-wrapper';
import { Order } from '../../../models/order';

const setup = async () => {
  const listener = new OrderCreatedListener(natsWrapper.client);

  const data: OrderCreatedEvent['data'] = {
    id: mongoose.Types.ObjectId().toHexString(),
    version: 1,
    status: OrderStatus.Created,
    userId: mongoose.Types.ObjectId().toHexString(),
    expiresAt: 'test',
    ticket: {
      id: mongoose.Types.ObjectId().toHexString(),
      price: 10,
    },
  };
  //@ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };
  return { listener, data, msg };
};

it('saves the order in the db once it receives an OrderCreatedEvent', async () => {
  const { listener, data, msg } = await setup();
  await listener.onMessage(data, msg);

  const order = await Order.findById(data.id);
  expect(order!.price).toEqual(data.ticket.price);
});

it('calls the ack function when it receives an OrderCreatedEvent', async () => {
  const { listener, data, msg } = await setup();
  await listener.onMessage(data, msg);
  expect(msg.ack).toHaveBeenCalled();
});

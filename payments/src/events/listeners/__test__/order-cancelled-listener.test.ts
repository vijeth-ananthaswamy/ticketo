import { Message } from 'node-nats-streaming';
import mongoose from 'mongoose';

import { OrderCreatedListener } from '../../listeners/order-created-listener';
import { OrderCancelledEvent, OrderStatus } from '@ticketo/common';
import { natsWrapper } from '../../../nats-wrapper';
import { Order } from '../../../models/order';
import { OrderCancelledListener } from '../order-cancelled-listener';

const setup = async () => {
  const listener = new OrderCancelledListener(natsWrapper.client);
  //@ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  const orderId = mongoose.Types.ObjectId().toHexString();

  const order = Order.build({
    id: orderId,
    version: 0,
    userId: mongoose.Types.ObjectId().toHexString(),
    price: 100,
    status: OrderStatus.Created,
  });

  await order.save();
  console.log(order);

  const data: OrderCancelledEvent['data'] = {
    id: orderId,
    version: 1,
    ticket: {
      id: mongoose.Types.ObjectId().toHexString(),
    },
  };
  return { listener, msg, order, data };
};

it('updates the order status to cancelled when a OrderCancelledEvent is received', async () => {
  const { listener, msg, order, data } = await setup();
  await listener.onMessage(data, msg);

  const fetchedOrder = await Order.findById(data.id);
  expect(fetchedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it('calls the ack function on update of order status', async () => {
  const { listener, msg, order, data } = await setup();
  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();
});

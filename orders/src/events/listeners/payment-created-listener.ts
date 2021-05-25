import {
  Subjects,
  Listener,
  PaymentCreatedEvent,
  NotFoundError,
  OrderStatus,
} from '@ticketo/common';
import { Message } from 'node-nats-streaming';
import { queueGroupName } from './queue-group-name';
import { Order } from '../../models/order';

export class PaymentCreatedListener extends Listener<PaymentCreatedEvent> {
  readonly subject = Subjects.PaymentCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: PaymentCreatedEvent['data'], msg: Message) {
    const { id: paymentId, orderId, stripeId } = data;
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError();
    }
    order.set({ status: OrderStatus.Complete });
    await order.save();

    msg.ack();
  }
}

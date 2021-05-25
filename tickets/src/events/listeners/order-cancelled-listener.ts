import {
  Listener,
  NotFoundError,
  OrderCancelledEvent,
  Subjects,
} from '@ticketo/common';
import { Message } from 'node-nats-streaming';

import { queueGroupName } from './queue-group-name';
import { Ticket } from '../../models/ticket';
import { TicketUpdatedPublisher } from '../publishers/ticket-updated-publisher';

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  readonly subject = Subjects.OrderCancelled;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCancelledEvent['data'], msg: Message) {
    //Find a ticket
    const ticket = await Ticket.findById(data.ticket.id);

    //Throw error if ticket is not found
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Set orderId of ticket to null and save the ticket
    ticket.set({ orderId: undefined });
    await ticket.save();

    //Publish the ticket updated event
    await new TicketUpdatedPublisher(this.client).publish({
      id: ticket.id,
      version: ticket.version,
      title: ticket.title,
      price: ticket.price,
      userId: ticket.userId,
      orderId: ticket.orderId,
    });

    msg.ack();
  }
}

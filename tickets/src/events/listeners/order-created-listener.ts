import {
  Listener,
  NotFoundError,
  OrderCreatedEvent,
  Subjects,
} from '@ticketo/common';
import { Message } from 'node-nats-streaming';
import { queueGroupName } from './queue-group-name';
import { Ticket } from '../../models/ticket';
import { TicketUpdatedPublisher } from '../publishers/ticket-updated-publisher';

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  readonly subject = Subjects.OrderCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCreatedEvent['data'], msg: Message) {
    const { id, version, status, userId, ticket } = data;

    //Find the ticket that the order is reserving for
    const fetchedTicket = await Ticket.findById(ticket.id);

    //Throw error if ticket not found
    if (!fetchedTicket) {
      throw new NotFoundError();
    }

    //Mark the ticket as reserved by setting its orderId property and save the ticket
    fetchedTicket.set({ orderId: id });
    await fetchedTicket.save();

    // Emit a ticket updated event
    await new TicketUpdatedPublisher(this.client).publish({
      id: fetchedTicket.id,
      price: fetchedTicket.price,
      title: fetchedTicket.title,
      userId: fetchedTicket.userId,
      orderId: fetchedTicket.orderId,
      version: fetchedTicket.version,
    });

    // ack the message
    msg.ack();
  }
}

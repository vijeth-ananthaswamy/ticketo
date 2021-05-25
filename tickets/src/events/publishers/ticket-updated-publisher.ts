import { Publisher, Subjects, TicketUpdatedEvent } from '@ticketo/common';

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
  readonly subject = Subjects.TicketUpdated;
}

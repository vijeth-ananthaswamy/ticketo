import { Publisher, Subjects, TicketCreatedEvent } from '@ticketo/common';

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
  readonly subject = Subjects.TicketCreated;
}

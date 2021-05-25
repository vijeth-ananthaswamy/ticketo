import { Publisher, Subjects, OrderCreatedEvent } from '@ticketo/common';

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
  readonly subject = Subjects.OrderCreated;
  
}

import { Publisher, Subjects, OrderCancelledEvent } from '@ticketo/common';

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
  readonly subject = Subjects.OrderCancelled;
}

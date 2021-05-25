import {Subjects, Publisher, PaymentCreatedEvent} from '@ticketo/common'

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
  readonly subject = Subjects.PaymentCreated;
    
}
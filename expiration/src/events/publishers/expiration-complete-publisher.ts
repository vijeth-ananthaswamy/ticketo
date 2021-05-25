import {Subjects, Publisher, ExpirationCompleteEvent} from '@ticketo/common'

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent>{
  readonly subject = Subjects.ExpirationComplete;

}
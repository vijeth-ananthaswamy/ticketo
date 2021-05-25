import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  requireAuth,
  validateRequest,
  NotFoundError,
  BadRequestError,
} from '@ticketo/common';
import { body } from 'express-validator';

import { Ticket } from '../models/ticket';
import { Order, OrderStatus } from '../models/order';
import { OrderCreatedPublisher } from './../events/publishers/order-created-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

const EXPIRATION_WINDOW_SECONDS = 90;

const validations = [
  body('ticketId')
    .not()
    .isEmpty()
    .custom((input: string) => mongoose.Types.ObjectId.isValid(input))
    .withMessage('A valid TicketId must be provided'),
];

router.post(
  '/api/orders',
  requireAuth,
  validations,
  validateRequest,
  async (req: Request, res: Response) => {
    console.log('NEW');
    const { ticketId } = req.body;

    //Find the ticket from the database
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw new NotFoundError();
    }

    //Check if the ticket is already reserved
    // Run a query to find an order associated with the ticket above *and*
    // the order status is *not* cancelled

    const isTicketReserved = await ticket.isReserved();

    if (isTicketReserved) {
      throw new BadRequestError('Ticket is already reserved');
    }

    //Calculate the expiration time for the order
    const expiration = new Date();
    expiration.setSeconds(expiration.getSeconds() + EXPIRATION_WINDOW_SECONDS);

    // Build the order and save it to the database

    const order = Order.build({
      userId: req.currentUser!.id,
      status: OrderStatus.Created,
      expiresAt: expiration,
      ticket: ticket,
    });

    await order.save();
    //TODO: Publish the event to say order was created

    new OrderCreatedPublisher(natsWrapper.client).publish({
      id: order.id,
      status: order.status,
      userId: order.userId,
      version: order.version,
      expiresAt: order.expiresAt.toISOString(),
      ticket: {
        id: ticket.id,
        price: ticket.price,
      },
    });
    res.status(201).send(order);
  }
);

export { router as newOrderRouter };

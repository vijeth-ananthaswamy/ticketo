import { Ticket } from '../ticket';

it('implements optimistic concurrency control', async (done) => {
  // create an instance of ticket and save to DB

  const ticket = Ticket.build({
    title: 'Concert',
    price: 5,
    userId: '123',
  });

  await ticket.save();
  //Fetch the ticket twice to two ticket instances

  const ticketOne = await Ticket.findById(ticket.id);
  const ticketTwo = await Ticket.findById(ticket.id);

  // Make two separate changes to the tickets we fetched
  ticketOne!.set({ price: 10 });
  ticketTwo!.set({ price: 20 });
  // save the first ticket instance with the changes
  await ticketOne!.save();

  //save the second ticket with the changes and expect an error
  try {
    await ticketTwo!.save();
  } catch (err) {
    return done();
  }
  throw new Error('Thsi test is failing');
});

it('increments the version number on multiple saves', async () => {
  // create an instance of ticket and save to DB

  const ticket = Ticket.build({
    title: 'Concert',
    price: 5,
    userId: '123',
  });

  await ticket.save();
  expect(ticket.version).toEqual(0);

  ticket.set({ price: 39 });
  await ticket.save();
  expect(ticket.version).toEqual(1);

  ticket.set({ price: 53 });
  await ticket.save();
  expect(ticket.version).toEqual(2);
});

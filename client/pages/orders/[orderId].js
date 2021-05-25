import { useState, useEffect } from 'react';
import StripeCheckout from 'react-stripe-checkout';
import Router from 'next/router';

import useRequest from '../../hooks/use-request';

const OrderShow = ({ order, currentUser }) => {
  const [timeLeft, setTimeLeft] = useState(90);
  const { doRequest, errors } = useRequest({
    url: '/api/payments',
    method: 'post',
    body: {
      orderId: order.id,
    },
    successCallback: (payment) => {
      console.log(payment);
      Router.push('/orders');
    },
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const milisecondsLeft = new Date(order.expiresAt) - new Date();
      setTimeLeft(Math.round(milisecondsLeft / 1000));
    };

    calculateTimeLeft();
    const timerId = setInterval(calculateTimeLeft, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  if (timeLeft < 0) {
    return <div>Order expired...</div>;
  }

  return (
    <div>
      Please make the payment within {timeLeft} seconds to confirm your order
      <StripeCheckout
        token={({ id }) => doRequest({ token: id })}
        stripeKey="pk_test_51ICEJtF3sX0bihbliPxvbm1FU26y1nK7lIEuczVw93dPj2evcpibrDbfwksAOM9B8GOH5ARDMboCm1TAfFE2fCe300gE1WM9TH"
        amount={order.ticket.price * 100}
        email={currentUser.email}
      ></StripeCheckout>
      {errors}
    </div>
  );
};

OrderShow.getInitialProps = async (context, client) => {
  const { orderId } = context.query;
  const { data } = await client.get(`/api/orders/${orderId}`);
  return { order: data };
};

export default OrderShow;

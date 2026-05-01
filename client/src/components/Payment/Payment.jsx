import { useState, useEffect } from 'react';
import { useStateValue } from '../../StateContext';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;

// Inner form — rendered only after clientSecret is available
function CheckoutForm({ order, orderId }) {
  const { state, dispatch } = useStateValue();
  const { user } = state;
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [succeeded, setSucceeded] = useState(false);

  const handleCardPayment = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin },
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message);
      setProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'paid',
        paymentId: paymentIntent.id,
      });
      try {
        await fetch('http://localhost:4242/send-order-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: { ...order, status: 'paid', paymentId: paymentIntent.id } }),
        });
      } catch (emailErr) {
        console.warn('Email notification failed:', emailErr.message);
      }
      setSucceeded(true);
      setProcessing(false);
      dispatch({ type: 'EMPTY_BASKET' });
      navigate(`/order-success/${orderId}`);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4">

      {/* Left — Order Summary */}
      <div className="flex-1 bg-white rounded-lg p-5">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Order Summary</h2>
        {order.items?.map((item, index) => (
          <div key={index} className="flex items-center gap-3 mb-3">
            <img src={item.image} alt={item.title} className="w-16 h-16 object-cover rounded-md" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{item.title}</p>
              <p className="text-sm font-bold text-gray-900">Rs. {item.price?.toLocaleString()}</p>
            </div>
          </div>
        ))}
        <div className="border-t pt-3 mt-3 flex flex-col gap-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span><span>Rs. {order.subtotal?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Delivery</span><span className="text-green-600 font-medium">FREE</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 border-t pt-2">
            <span>Total</span><span>Rs. {order.total?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Right — Card Payment */}
      <div className="lg:w-96 bg-white rounded-lg p-5">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Card Payment</h2>
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Paying as:</p>
          <p className="text-sm font-medium text-gray-800">{user?.email}</p>
        </div>
        <div className="bg-gray-50 rounded-md p-3 mb-4">
          <p className="text-xs text-gray-500 mb-1">Delivering to:</p>
          <p className="text-sm font-medium text-gray-800">{order.customerDetails?.firstName} {order.customerDetails?.lastName}</p>
          <p className="text-xs text-gray-500">{order.customerDetails?.address}, {order.customerDetails?.city}</p>
          <p className="text-xs text-gray-500">{order.customerDetails?.phone}</p>
        </div>

        <form onSubmit={handleCardPayment}>
          <div className="mb-4 border border-gray-200 rounded-md p-3">
            <PaymentElement />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-md mb-4">{error}</div>
          )}
          {succeeded && (
            <div className="bg-green-50 border border-green-200 text-green-600 text-sm px-3 py-2 rounded-md mb-4">Payment successful!</div>
          )}
          <button
            type="submit"
            disabled={!stripe || processing || succeeded}
            className="w-full bg-[#f3a847] hover:bg-[#e8a020] disabled:bg-gray-300 disabled:cursor-not-allowed text-black font-semibold py-2 rounded-md transition-colors"
          >
            {processing ? 'Processing...' : `Pay Rs. ${order.total?.toLocaleString()}`}
          </button>
        </form>
      </div>

    </div>
  );
}

function Payment() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const orderDoc = await getDoc(doc(db, 'orders', orderId));
        if (!orderDoc.exists()) { setLoadError('Order not found.'); return; }
        const orderData = { id: orderDoc.id, ...orderDoc.data() };
        setOrder(orderData);

        const res = await fetch('http://localhost:4242/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: orderData.total * 100 }),
        });
        const data = await res.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setLoadError('Could not initialize payment. Make sure the backend server is running.');
        }
      } catch (err) {
        console.error(err);
        setLoadError('Could not connect to payment server. Please make sure the backend is running on port 4242.');
      }
    };
    if (orderId) init();
  }, [orderId]);

  if (!stripePromise) {
    return (
      <div className="bg-[#f3f3f3] min-h-screen p-4 flex items-center justify-center">
        <div className="bg-white p-8 max-w-md w-full border border-red-100">
          <h2 className="text-lg font-bold text-red-600 mb-2">Stripe Not Configured</h2>
          <p className="text-gray-500 text-sm">Add <code className="bg-gray-100 px-1">VITE_STRIPE_PUBLISHABLE_KEY</code> to your <code className="bg-gray-100 px-1">.env</code> file and restart.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f3f3f3] min-h-screen p-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Complete Payment</h1>

        {loadError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-md mb-4">{loadError}</div>
        )}

        {!order || !clientSecret ? (
          <div className="flex items-center justify-center h-48">
            {!loadError && <div className="w-8 h-8 border-2 border-[#f3a847] border-t-transparent rounded-full animate-spin"/>}
          </div>
        ) : (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm order={order} orderId={orderId} />
          </Elements>
        )}
      </div>
    </div>
  );
}

export default Payment;
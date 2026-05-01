import { useParams, Link } from 'react-router-dom';

function OrderSuccess() {
  const { orderId } = useParams();

  return (
    <div className="bg-[#f3f3f3] min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-10 max-w-md w-full text-center">

        <div className="text-6xl mb-4">🎉</div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Order Placed Successfully!
        </h1>

        <p className="text-gray-500 text-sm mb-2">
          Your order has been placed. You will receive a confirmation email shortly.
        </p>

        <p className="text-xs text-gray-400 mb-6">
          Order ID: #{orderId?.slice(0, 8).toUpperCase()}
        </p>

        <div className="flex flex-col gap-3">
          <Link
            to="/orders"
            className="bg-[#f3a847] hover:bg-[#e8a020] text-black font-semibold py-2 rounded-md transition-colors"
          >
            View My Orders
          </Link>
          <Link
            to="/"
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 rounded-md transition-colors"
          >
            Continue Shopping
          </Link>
        </div>

      </div>
    </div>
  );
}

export default OrderSuccess;
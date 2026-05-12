import { Link } from 'react-router-dom';
import { useStateValue } from '../../StateContext';

function Basket() {
  const { state, dispatch } = useStateValue();
  const { basket } = state;

  const removeFromBasket = (id) => {
    dispatch({
      type: 'REMOVE_FROM_BASKET',
      id: id,
    });
  };

  const total = basket.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="bg-[#f3f3f3] min-h-screen p-4">
      <div className="max-w-5xl mx-auto">

        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Your Basket
        </h1>

        {basket.length === 0 ? (
          <div className="bg-white rounded-lg p-10 text-center">
            <p className="text-gray-500 text-lg mb-4">Your basket is empty!</p>
            <Link
              to="/"
              className="bg-[#f3a847] hover:bg-[#e8a020] text-black font-semibold px-6 py-2 rounded-md transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4">

            <div className="flex-1 flex flex-col gap-3">
              {basket.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-4 flex gap-4 items-center"
                >
                  <img
                    src={item.selectedVariant?.image || item.image}
                    alt={item.title}
                    className="w-24 h-24 object-cover rounded-md"
                  />

                  <div className="flex-1">
                    <p className="text-xs text-[#f3a847] font-semibold uppercase mb-1">
                      {item.category}
                    </p>
                    <h3 className="text-sm font-medium text-gray-800 mb-1">
                      {item.title}
                    </h3>

                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${i < Math.floor(item.rating) ? 'text-[#f3a847]' : 'text-gray-300'}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>

                    <p className="text-lg font-bold text-gray-900">
                      Rs. {item.price.toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() => removeFromBasket(item.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                  >
                    Remove
                  </button>

                </div>
              ))}
            </div>

            <div className="lg:w-72">
              <div className="bg-white rounded-lg p-5 sticky top-24">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  Order Summary
                </h2>

                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Items ({basket.length})</span>
                  <span>Rs. {total.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Delivery</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>

                <div className="border-t border-gray-200 my-3"/>

                <div className="flex justify-between font-bold text-gray-900 mb-5">
                  <span>Total</span>
                  <span>Rs. {total.toLocaleString()}</span>
                </div>

                <Link
                  to="/checkout"
                  className="block bg-[#f3a847] hover:bg-[#e8a020] text-black text-center font-semibold py-2 rounded-md transition-colors"
                >
                  Proceed to Checkout
                </Link>

              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default Basket;
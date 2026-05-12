import { useState, useEffect } from 'react';
import { useStateValue } from '../../StateContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

function Checkout() {
  const { state, dispatch } = useStateValue();
  const { basket, user } = state;
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [paymentAccounts, setPaymentAccounts] = useState({});
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState('');

  const total = basket.reduce((sum, item) => sum + item.price, 0);
  const deliveryFee = paymentMethod === 'cod' ? 250 : 0;
  const grandTotal = total + deliveryFee;

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  });

  useEffect(() => {
    const fetchAccounts = async () => {
      const snap = await getDoc(doc(db, 'settings', 'paymentAccounts'));
      if (snap.exists()) setPaymentAccounts(snap.data());
    };
    fetchAccounts();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleReceiptChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFile(file);
      setReceiptPreview(URL.createObjectURL(file));
    }
  };

  const uploadReceipt = async () => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error('Cloudinary config missing. Please contact support.');
    }
    const data = new FormData();
    data.append('file', receiptFile);
    data.append('upload_preset', UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: data,
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      throw new Error(json.error?.message || `Receipt upload failed (${res.status})`);
    }
    if (!json.secure_url) {
      throw new Error('Receipt upload did not return a URL.');
    }
    return json.secure_url;
  };

  const validateReceipt = () => {
    if (!['jazzcash', 'easypaisa', 'nayapay'].includes(paymentMethod)) return true;
    if (!receiptFile) {
      setError('Please upload your payment receipt screenshot.');
      return false;
    }
    // Basic filename validation
    const filename = receiptFile.name.toLowerCase();
    const methodKeywords = {
      jazzcash: ['jazz', 'cash'],
      easypaisa: ['easypaisa', 'ep', 'easy'],
      nayapay: ['naya', 'nayapay'],
    };
    const keywords = methodKeywords[paymentMethod] || [];
    const hasKeyword = keywords.some((k) => filename.includes(k));
    // Also accept common image extensions as fallback (user may rename files)
    const isImage = /\.(jpg|jpeg|png|webp)$/i.test(filename);
    if (!hasKeyword && !isImage) {
      setError('Invalid receipt. Please upload the correct payment receipt.');
      return false;
    }
    return true;
  };

 const placeOrder = async (e) => {
  e.preventDefault();
  setError('');

  if (['jazzcash', 'easypaisa', 'nayapay'].includes(paymentMethod)) {
    if (!validateReceipt()) return;
  }

  setProcessing(true);

  try {
    let receiptURL = null;
    if (receiptFile) {
      receiptURL = await uploadReceipt();
    }

    const order = {
      user: user?.email || 'guest',
      userId: user?.uid || 'guest',
      customerDetails: form,
      items: basket,
      subtotal: total,
      deliveryFee: deliveryFee,
      total: grandTotal,
      paymentMethod: paymentMethod,
      paymentStatus: ['jazzcash', 'easypaisa', 'nayapay'].includes(paymentMethod)
        ? 'pending'
        : paymentMethod === 'cod'
        ? 'cod'
        : 'pending',
      orderStatus: 'pending',
      receiptURL: receiptURL || null,
      createdAt: new Date(),
    };

    const docRef = await addDoc(collection(db, 'orders'), order);

    // Email — sirf COD aur manual ke liye, online mein baad mein
    if (paymentMethod !== 'online') {
      try {
        await fetch('http://localhost:4242/send-order-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: { ...order, id: docRef.id } }),
        });
      } catch (emailErr) {
        console.warn('Email notification failed:', emailErr.message);
      }

      dispatch({ type: 'EMPTY_BASKET' });
      navigate(`/order-success/${docRef.id}`);
    } else {
      // Online — Payment page par jao, basket mat hatao
      navigate(`/payment/${docRef.id}`);
    }

  } catch (err) {
    setError('Error placing order: ' + err.message);
  } finally {
    setProcessing(false);
  }
};

  const isManualPayment = ['jazzcash', 'easypaisa', 'nayapay'].includes(paymentMethod);

  return (
    <div className="bg-[#f3f3f3] min-h-screen p-4">
      <div className="max-w-5xl mx-auto">

        <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>

        <form onSubmit={placeOrder} className="flex flex-col lg:flex-row gap-4">

          {/* Left — Form */}
          <div className="flex-1 flex flex-col gap-4">

            {/* Contact Details */}
            <div className="bg-white rounded-lg p-5">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Contact Details</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" name="firstName" value={form.firstName} onChange={handleChange} placeholder="Husna" required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f3a847] focus:ring-1 focus:ring-[#f3a847]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" name="lastName" value={form.lastName} onChange={handleChange} placeholder="Zaheer" required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f3a847] focus:ring-1 focus:ring-[#f3a847]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="husna@email.com" required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f3a847] focus:ring-1 focus:ring-[#f3a847]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+92 300 1234567" required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f3a847] focus:ring-1 focus:ring-[#f3a847]" />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg p-5">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Shipping Address</h2>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input type="text" name="address" value={form.address} onChange={handleChange} placeholder="House no, Street, Block" required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f3a847] focus:ring-1 focus:ring-[#f3a847]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input type="text" name="city" value={form.city} onChange={handleChange} placeholder="Lahore" required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f3a847] focus:ring-1 focus:ring-[#f3a847]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                    <input type="text" name="postalCode" value={form.postalCode} onChange={handleChange} placeholder="54000"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f3a847] focus:ring-1 focus:ring-[#f3a847]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg p-5">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Payment Method</h2>
              <div className="flex flex-col gap-3">
                <label className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-[#f3a847] bg-orange-50' : 'border-gray-200'}`}>
                  <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="accent-[#f3a847]" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">Cash on Delivery</p>
                    <p className="text-xs text-gray-500">Rs. 250 delivery fee — 3-5 days</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Rs. 250</span>
                </label>

                <label className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${paymentMethod === 'online' ? 'border-[#f3a847] bg-orange-50' : 'border-gray-200'}`}>
                  <input type="radio" name="paymentMethod" value="online" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} className="accent-[#f3a847]" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">Card Payment (Stripe)</p>
                    <p className="text-xs text-gray-500">Free delivery — 3-5 days</p>
                  </div>
                  <span className="text-sm font-semibold text-green-600">FREE</span>
                </label>

                {/* Manual Payment Methods */}
                {['jazzcash', 'easypaisa', 'nayapay'].map((method) => (
                  <label key={method} className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${paymentMethod === method ? 'border-[#f3a847] bg-orange-50' : 'border-gray-200'}`}>
                    <input type="radio" name="paymentMethod" value={method} checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} className="accent-[#f3a847]" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800 capitalize">{method === 'jazzcash' ? 'JazzCash' : method === 'easypaisa' ? 'Easypaisa' : 'NayaPay'}</p>
                      <p className="text-xs text-gray-500">Manual wallet payment — Free delivery</p>
                    </div>
                    <span className="text-sm font-semibold text-green-600">FREE</span>
                  </label>
                ))}
              </div>

              {/* Manual Payment Details */}
              {isManualPayment && (
                <div className="mt-4 p-4 bg-[#f9f9f9] border border-gray-100">
                  <h3 className="text-xs font-bold text-[#131921] uppercase tracking-wider mb-3">Send Payment To</h3>
                  {paymentAccounts[paymentMethod]?.accountName ? (
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-500">Account Name:</span> <span className="font-semibold text-[#131921]">{paymentAccounts[paymentMethod].accountName}</span></p>
                      <p><span className="text-gray-500">Account Number:</span> <span className="font-semibold text-[#131921]">{paymentAccounts[paymentMethod].accountNumber}</span></p>
                      <p className="text-xs text-gray-400 mt-2">Please send Rs. {grandTotal.toLocaleString()} to the above account, then upload your receipt below.</p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">Account details not configured. Please contact support.</p>
                  )}

                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-[#131921] uppercase tracking-wider mb-2">Upload Receipt Screenshot</label>
                    <input type="file" accept="image/*" onChange={handleReceiptChange}
                      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f3a847] bg-white" />
                    {receiptPreview && (
                      <div className="mt-2">
                        <img src={receiptPreview} alt="Receipt preview" className="w-32 h-32 object-cover rounded-md border" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right — Order Summary */}
          <div className="lg:w-80">
            <div className="bg-white rounded-lg p-5 sticky top-24">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Order Summary</h2>

              {basket.map((item, index) => (
                <div key={index} className="flex items-center gap-3 mb-3">
                  <img src={item.image} alt={item.title} className="w-14 h-14 object-cover rounded-md" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-800 line-clamp-2">{item.title}</p>
                    <p className="text-sm font-bold text-gray-900">Rs. {item.price.toLocaleString()}</p>
                  </div>
                </div>
              ))}

              <div className="border-t pt-3 mt-3 flex flex-col gap-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>Rs. {total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Delivery</span>
                  <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>
                    {deliveryFee === 0 ? 'FREE' : `Rs. ${deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 text-base border-t pt-2 mt-1">
                  <span>Total</span>
                  <span>Rs. {grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-md mt-3">
                  {error}
                </div>
              )}

              <button type="submit" disabled={processing || basket.length === 0}
                className="w-full bg-[#f3a847] hover:bg-[#e8a020] disabled:bg-gray-300 disabled:cursor-not-allowed text-black font-semibold py-2 rounded-md transition-colors mt-4">
                {processing ? 'Placing Order...' : 'Place Order'}
              </button>

            </div>
          </div>

        </form>
      </div>
    </div>
  );
}

export default Checkout;
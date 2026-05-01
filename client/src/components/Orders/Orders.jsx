import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { useStateValue } from '../../StateContext';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Eye, CheckCircle, Clock, Truck, Package, User, Mail, Shield } from 'lucide-react';

function Orders() {
  const { state } = useStateValue();
  const { user } = state;
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        setError('');
        const map = new Map();

        // Query 1: orders placed while logged in
        try {
          const q1 = query(collection(db, 'orders'), where('user', '==', user.email));
          const snap1 = await getDocs(q1);
          snap1.docs.forEach((doc) => map.set(doc.id, { id: doc.id, ...doc.data() }));
        } catch (e) {
          console.warn('Query 1 failed:', e.message);
        }

        // Query 2: orders matched by customer email
        try {
          const q2 = query(collection(db, 'orders'), where('customerDetails.email', '==', user.email));
          const snap2 = await getDocs(q2);
          snap2.docs.forEach((doc) => map.set(doc.id, { id: doc.id, ...doc.data() }));
        } catch (e) {
          console.warn('Query 2 failed:', e.message);
        }

        const ordersData = Array.from(map.values()).sort((a, b) => {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return bTime - aTime;
        });

        setOrders(ordersData);

        // If both queries returned zero results because of permissions, show rules hint
        if (ordersData.length === 0) {
          console.log('No orders found for email:', user.email);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate]);

  const getStatusBadge = (order) => {
    const status = order.orderStatus || 'pending';
    const paymentStatus = order.paymentStatus;

    if (paymentStatus === 'verified') {
      return { text: 'Payment Verified', class: 'bg-green-100 text-green-700', icon: <CheckCircle size={12}/> };
    }
    if (status === 'shipped') {
      return { text: 'Shipped', class: 'bg-blue-100 text-blue-700', icon: <Truck size={12}/> };
    }
    if (status === 'delivered') {
      return { text: 'Delivered', class: 'bg-[#f3a847]/20 text-[#131921]', icon: <Package size={12}/> };
    }
    if (['jazzcash', 'easypaisa', 'nayapay'].includes(order.paymentMethod) && paymentStatus !== 'verified') {
      return { text: 'Payment Pending', class: 'bg-yellow-100 text-yellow-700', icon: <Clock size={12}/> };
    }
    return { text: 'Processing', class: 'bg-gray-100 text-gray-600', icon: <Clock size={12}/> };
  };

  return (
    <div className="bg-[#f3f3f3] min-h-screen p-4">
      <div className="max-w-4xl mx-auto">

        {/* ── USER PROFILE ── */}
        <div className="bg-white p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-14 h-14 bg-[#131921] flex items-center justify-center shrink-0">
            <User size={24} className="text-[#f3a847]"/>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-[#131921] tracking-wide">My Orders</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <Mail size={12} className="text-gray-400"/>
                {user?.email}
              </span>
              {user?.emailVerified && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2 py-0.5">
                  <Shield size={10}/> Verified
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Total Orders</p>
            <p className="text-2xl font-bold text-[#131921]">{orders.length}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-sm p-4 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="w-8 h-8 border-2 border-[#f3a847] border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white p-10 text-center">
            <p className="text-gray-500 text-lg mb-4">No orders yet!</p>
            <Link to="/shop"
              className="inline-flex items-center gap-2 bg-[#f3a847] hover:bg-[#e8a020] text-black font-bold px-8 py-3 transition-colors text-xs tracking-[0.2em] uppercase"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order) => {
              const badge = getStatusBadge(order);
              return (
                <div key={order.id} className="bg-white p-5">

                  {/* Order Header */}
                  <div className="flex flex-wrap justify-between items-start border-b border-gray-100 pb-3 mb-3 gap-3">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Order ID</p>
                      <p className="text-sm font-bold text-[#131921]">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Date</p>
                      <p className="text-sm text-gray-700">
                        {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-PK') : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Payment</p>
                      <p className="text-sm text-gray-700 capitalize">
                        {order.paymentMethod === 'cod' ? 'Cash on Delivery' :
                         order.paymentMethod === 'online' ? 'Card Payment' :
                         order.paymentMethod || '—'}
                      </p>
                    </div>
                    <div>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 tracking-wider uppercase ${badge.class}`}>
                        {badge.icon}
                        {badge.text}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="flex flex-col gap-3 mb-3">
                    {order.items?.map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-14 h-14 object-cover border border-gray-100"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#131921] truncate">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-[#f3a847] font-semibold uppercase tracking-wider">
                            {item.category}
                          </p>
                          <p className="text-sm font-bold text-[#131921]">
                            Rs. {item.price?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Receipt & Total */}
                  <div className="border-t border-gray-100 pt-3 flex flex-wrap justify-between items-center gap-3">
                    <div className="flex items-center gap-3">
                      {order.receiptURL && (
                        <button
                          onClick={() => setSelectedReceipt(order.receiptURL)}
                          className="inline-flex items-center gap-1 text-[#f3a847] hover:text-[#e8a020] text-xs font-semibold"
                        >
                          <Eye size={12}/> View Receipt
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">Order Total:</p>
                      <p className="text-base font-bold text-[#131921]">
                        Rs. {order.total?.toLocaleString()}
                      </p>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSelectedReceipt(null)}>
          <div className="bg-white p-2 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end mb-2">
              <button onClick={() => setSelectedReceipt(null)} className="text-gray-400 hover:text-[#131921]">✕</button>
            </div>
            <img src={selectedReceipt} alt="Receipt" className="w-full"/>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
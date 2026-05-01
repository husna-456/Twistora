import { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase';
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  updateDoc, query, orderBy, getDoc, setDoc
} from 'firebase/firestore';
import { useStateValue } from '../../StateContext';
import { useNavigate } from 'react-router-dom';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase';
import {
  LayoutDashboard, Package, ShoppingCart, Settings,
  Plus, Trash2, Search, Eye, X, ChevronDown,
  Users, DollarSign, TrendingUp, CheckCircle, Clock,
  Truck, Mail, LogOut, Wallet, Smartphone, CreditCard,
  Pencil, MoreVertical
} from 'lucide-react';

const ADMIN_EMAIL = 'zaheerfarooq456@gmail.com';
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const PAYMENT_METHODS = ['jazzcash', 'easypaisa', 'nayapay'];

function Admin() {
  const { state } = useStateValue();
  const { user } = state;
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Product form state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [form, setForm] = useState({
    title: '', price: '', salePrice: '', category: '', rating: '4.5',
    description: '', stock: '', material: '', sku: '', tags: '',
  });
  const [colorInput, setColorInput] = useState('#f3a847');
  const [colors, setColors] = useState([]);

  // Settings state
  const [settings, setSettings] = useState({
    jazzcash: { accountName: '', accountNumber: '' },
    easypaisa: { accountName: '', accountNumber: '' },
    nayapay: { accountName: '', accountNumber: '' },
  });

  // Orders filter
  const [orderFilter, setOrderFilter] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Edit product state
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '', price: '', salePrice: '', category: '', rating: '4.5',
    description: '', stock: '', material: '', sku: '', tags: '', image: '',
  });
  const [editColors, setEditColors] = useState([]);
  const [editColorInput, setEditColorInput] = useState('#f3a847');

  // Action menu dropdown state
  const [openActionMenu, setOpenActionMenu] = useState(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/admin/login');
    } catch (err) {
      showMessage('Error: ' + err.message);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const [prodSnap, orderSnap, settingsSnap] = await Promise.all([
        getDocs(collection(db, 'products')),
        getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'))),
        getDoc(doc(db, 'settings', 'paymentAccounts')),
      ]);

      setProducts(prodSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setOrders(orderSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      // Unique users from orders
      const uniqueEmails = [...new Set(orderSnap.docs.map((d) => d.data().customerDetails?.email).filter(Boolean))];
      setUsers(uniqueEmails);

      if (settingsSnap.exists()) {
        setSettings(settingsSnap.data());
      }
    } catch (error) {
      console.error('Fetch error:', error);
      if (error.code === 'permission-denied') {
        showMessage('Permission denied. Please check Firestore rules.');
      } else {
        showMessage('Failed to load data: ' + error.message);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setAuthChecked(true);
      if (!firebaseUser) {
        navigate('/admin/login');
      } else if (firebaseUser.email !== ADMIN_EMAIL) {
        navigate('/');
      } else {
        fetchData();
      }
    });
    return () => unsubscribe();
  }, [navigate, fetchData]);

  const uploadToCloudinary = async (file) => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error('Cloudinary config missing. Check VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET env vars.');
    }
    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: data,
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      throw new Error(json.error?.message || `Cloudinary upload failed (${res.status})`);
    }
    if (!json.secure_url) {
      throw new Error('Cloudinary response did not contain a secure URL.');
    }
    return json.secure_url;
  };

  // ── ADD PRODUCT ──
  const addProduct = async (e) => {
    e.preventDefault();
    if (!imageFile) { showMessage('Please select an image!'); return; }
    setLoading(true);
    try {
      setUploadProgress(30);
      const imageURL = await uploadToCloudinary(imageFile);
      if (!imageURL) {
        throw new Error('Image upload returned empty URL. Please try again.');
      }
      setUploadProgress(70);

      await addDoc(collection(db, 'products'), {
        title: form.title,
        price: Number(form.price),
        salePrice: form.salePrice ? Number(form.salePrice) : null,
        category: form.category,
        rating: Number(form.rating),
        image: imageURL,
        description: form.description,
        stock: Number(form.stock) || 0,
        material: form.material,
        sku: form.sku || `TW-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        tags: form.tags,
        colors: colors.length ? colors : ['#f3a847', '#C0C0C0', '#131921'],
        createdAt: new Date(),
      });

      setUploadProgress(100);
      showMessage('Product added successfully!');
      setForm({ title: '', price: '', salePrice: '', category: '', rating: '4.5', description: '', stock: '', material: '', sku: '', tags: '' });
      setImageFile(null); setImagePreview(''); setColors([]);
      setTimeout(() => setUploadProgress(0), 1000);
      fetchData();
    } catch (err) {
      showMessage('Error: ' + err.message);
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = (id) => {
    setConfirmModal({
      open: true,
      title: 'Delete Product',
      message: 'Are you sure you want to delete this product? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmModal({ open: false, title: '', message: '', onConfirm: null });
        try {
          await deleteDoc(doc(db, 'products', id));
          showMessage('Product deleted!');
          fetchData();
        } catch (err) { showMessage('Error: ' + err.message); }
      },
    });
  };

  // ── EDIT PRODUCT ──
  const openEditModal = (product) => {
    setEditingProduct(product);
    setEditForm({
      title: product.title || '',
      price: product.price || '',
      salePrice: product.salePrice || '',
      category: product.category || '',
      rating: product.rating || '4.5',
      description: product.description || '',
      stock: product.stock || '',
      material: product.material || '',
      sku: product.sku || '',
      tags: product.tags || '',
      image: product.image || '',
    });
    setEditColors(product.colors || ['#f3a847', '#C0C0C0', '#131921']);
    setEditColorInput('#f3a847');
  };

  const closeEditModal = () => {
    setEditingProduct(null);
    setEditForm({
      title: '', price: '', salePrice: '', category: '', rating: '4.5',
      description: '', stock: '', material: '', sku: '', tags: '', image: '',
    });
    setEditColors([]);
  };

  const saveEditProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      await updateDoc(doc(db, 'products', editingProduct.id), {
        title: editForm.title,
        price: Number(editForm.price),
        salePrice: editForm.salePrice ? Number(editForm.salePrice) : null,
        category: editForm.category,
        rating: Number(editForm.rating),
        description: editForm.description,
        stock: Number(editForm.stock) || 0,
        material: editForm.material,
        sku: editForm.sku,
        tags: editForm.tags,
        colors: editColors.length ? editColors : ['#f3a847', '#C0C0C0', '#131921'],
      });
      showMessage('Product updated successfully!');
      closeEditModal();
      fetchData();
    } catch (err) {
      showMessage('Error: ' + err.message);
    }
  };

  // ── DELETE ORDER ──
  const deleteOrder = (orderId) => {
    setConfirmModal({
      open: true,
      title: 'Delete Order',
      message: 'Are you sure you want to delete this order? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmModal({ open: false, title: '', message: '', onConfirm: null });
        try {
          await deleteDoc(doc(db, 'orders', orderId));
          showMessage('Order deleted!');
          fetchData();
        } catch (err) { showMessage('Error: ' + err.message); }
      },
    });
  };

  // ── ORDER STATUS ──
  const updateOrderStatus = async (order, newStatus) => {
    try {
      await updateDoc(doc(db, 'orders', order.id), { orderStatus: newStatus });

      // Send status email to customer
      try {
        await fetch('http://localhost:4242/send-status-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order, status: newStatus }),
        });
      } catch (emailErr) {
        console.warn('Status email failed:', emailErr.message);
      }

      showMessage(`Order status updated to ${newStatus}`);
      fetchData();
    } catch (err) { showMessage('Error: ' + err.message); }
  };

  const verifyPayment = async (order) => {
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        paymentStatus: 'verified',
        orderStatus: 'processing',
      });

      // Send verification email
      await fetch('http://localhost:4242/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: order.customerDetails?.email,
          name: order.customerDetails?.firstName,
          orderId: order.id,
        }),
      });

      showMessage('Payment verified & email sent!');
      fetchData();
    } catch (err) { showMessage('Error: ' + err.message); }
  };

  // ── SETTINGS ──
  const saveSettings = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'settings', 'paymentAccounts'), settings);
      showMessage('Settings saved successfully!');
    } catch (err) { showMessage('Error: ' + err.message); }
  };

  // ── DASHBOARD STATS ──
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingOrders = orders.filter((o) => o.orderStatus === 'pending' || !o.orderStatus).length;
  const verifiedOrders = orders.filter((o) => o.paymentStatus === 'verified').length;

  // Filtered orders
  const filteredOrders = orderFilter === 'all'
    ? orders
    : orders.filter((o) => (o.orderStatus || 'pending') === orderFilter);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f3f3]">
        <div className="w-8 h-8 border-2 border-[#f3a847] border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18}/> },
    { key: 'products', label: 'Add Products', icon: <Package size={18}/> },
    { key: 'orders', label: 'Manage Orders', icon: <ShoppingCart size={18}/> },
    { key: 'settings', label: 'Settings', icon: <Settings size={18}/> },
  ];

  return (
    <div className="min-h-screen bg-[#f3f3f3] flex">
      {/* ── SIDEBAR ── */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#131921] transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 flex flex-col`}>
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-[#f3a847] text-2xl font-bold tracking-tighter">Twistora</h1>
          <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest">Admin Panel</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => { setActiveTab(item.key); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === item.key
                  ? 'bg-[#f3a847] text-[#131921]'
                  : 'text-gray-400 hover:bg-[#232f3e] hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800 space-y-3">
          <div>
            <p className="text-gray-600 text-[10px] uppercase tracking-wider">Logged in as</p>
            <p className="text-gray-400 text-xs truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut size={18}/>
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)}/>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-600">
            <Settings size={20}/>
          </button>
          <h2 className="text-lg font-bold text-[#131921] capitalize">{activeTab}</h2>
          <div className="w-8"/>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4 text-sm">
              {message}
            </div>
          )}

          {/* ═══════ DASHBOARD ═══════ */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Welcome Header */}
              <div className="bg-[#131921] p-8 relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-[#f3a847] text-xs uppercase tracking-[0.3em] mb-2">Dashboard</p>
                  <h1 className="text-white text-2xl font-bold">Welcome back, Admin</h1>
                  <p className="text-gray-400 text-sm mt-1">Here is what's happening with your store today.</p>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#f3a847]/5 rounded-full -translate-y-1/2 translate-x-1/2"/>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Users', value: users.length, icon: <Users size={22}/>, border: 'border-l-4 border-l-blue-500', iconBg: 'bg-blue-50 text-blue-600' },
                  { label: 'Total Products', value: products.length, icon: <Package size={22}/>, border: 'border-l-4 border-l-purple-500', iconBg: 'bg-purple-50 text-purple-600' },
                  { label: 'Total Orders', value: orders.length, icon: <ShoppingCart size={22}/>, border: 'border-l-4 border-l-orange-500', iconBg: 'bg-orange-50 text-orange-600' },
                  { label: 'Revenue', value: `Rs. ${totalRevenue.toLocaleString()}`, icon: <DollarSign size={22}/>, border: 'border-l-4 border-l-green-500', iconBg: 'bg-green-50 text-green-600' },
                ].map((stat) => (
                  <div key={stat.label} className={`bg-white p-6 border border-gray-100 ${stat.border} hover:shadow-md transition-shadow`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-400 text-[10px] uppercase tracking-[0.2em] font-semibold">{stat.label}</span>
                      <div className={`w-11 h-11 flex items-center justify-center rounded-lg ${stat.iconBg}`}>
                        {stat.icon}
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-[#131921]">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Order Status Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 border border-gray-100">
                  <h3 className="text-sm font-bold text-[#131921] uppercase tracking-wider mb-6">Order Overview</h3>
                  <div className="space-y-5">
                    {[
                      { label: 'Pending', count: pendingOrders, color: 'bg-yellow-400', textColor: 'text-yellow-600' },
                      { label: 'Payment Verified', count: verifiedOrders, color: 'bg-green-400', textColor: 'text-green-600' },
                      { label: 'Shipped', count: orders.filter((o) => o.orderStatus === 'shipped').length, color: 'bg-blue-400', textColor: 'text-blue-600' },
                      { label: 'Delivered', count: orders.filter((o) => o.orderStatus === 'delivered').length, color: 'bg-[#f3a847]', textColor: 'text-[#f3a847]' },
                    ].map((bar) => (
                      <div key={bar.label}>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-gray-500 font-medium">{bar.label}</span>
                          <span className={`font-bold ${bar.textColor}`}>{bar.count}</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${bar.color} transition-all duration-700`} style={{ width: `${Math.min((bar.count / (orders.length || 1)) * 100, 100)}%` }}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 border border-gray-100">
                  <h3 className="text-sm font-bold text-[#131921] uppercase tracking-wider mb-6">Recent Orders</h3>
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#f9f9f9] flex items-center justify-center text-[#f3a847]">
                            <Package size={14}/>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#131921]">#{order.id.slice(0, 8).toUpperCase()}</p>
                            <p className="text-[10px] text-gray-400">{order.customerDetails?.firstName} {order.customerDetails?.lastName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-[#131921]">Rs. {order.total?.toLocaleString()}</p>
                          <span className={`text-[10px] px-2 py-0.5 uppercase ${
                            order.paymentStatus === 'verified' ? 'bg-green-100 text-green-700' :
                            order.paymentMethod?.startsWith('jazz') || order.paymentMethod?.startsWith('easy') || order.paymentMethod?.startsWith('naya')
                              ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {order.paymentStatus === 'verified' ? 'Verified' : order.orderStatus || 'Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {orders.length === 0 && (
                      <div className="text-center py-8">
                        <Package size={24} className="text-gray-200 mx-auto mb-2"/>
                        <p className="text-gray-400 text-xs">No orders yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════ ADD PRODUCTS ═══════ */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="bg-white p-6 border border-gray-100">
                <h3 className="text-sm font-bold text-[#131921] uppercase tracking-wider mb-6">Add New Product</h3>
                <form onSubmit={addProduct} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-[#131921] uppercase tracking-wider mb-2">Product Name</label>
                    <input type="text" name="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
                      className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#f3a847] transition-colors bg-white" placeholder="e.g. Gold Chain Bracelet"/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#131921] uppercase tracking-wider mb-2">Category</label>
                    <select name="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required
                      className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#f3a847] transition-colors bg-white">
                      <option value="">Select category</option>
                      {['Gold', 'Silver', 'Diamond', 'Charms', 'Bangles', 'Beaded', 'Couples'].map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#131921] uppercase tracking-wider mb-2">Price (Rs.)</label>
                    <input type="number" name="price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required
                      className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#f3a847] transition-colors bg-white" placeholder="2499"/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#131921] uppercase tracking-wider mb-2">Sale Price (Optional)</label>
                    <input type="number" name="salePrice" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                      className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#f3a847] transition-colors bg-white" placeholder="1999"/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#131921] uppercase tracking-wider mb-2">Rating (1-5)</label>
                    <input type="number" name="rating" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} min="1" max="5" step="0.1" required
                      className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#f3a847] transition-colors bg-white"/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#131921] uppercase tracking-wider mb-2">Stock Quantity</label>
                    <input type="number" name="stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#f3a847] transition-colors bg-white" placeholder="50"/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#131921] uppercase tracking-wider mb-2">Material</label>
                    <input type="text" name="material" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })}
                      className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#f3a847] transition-colors bg-white" placeholder="18K Gold Plated"/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#131921] uppercase tracking-wider mb-2">SKU</label>
                    <input type="text" name="sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
                      className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#f3a847] transition-colors bg-white" placeholder="TW-GOLD-001"/>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-[#131921] uppercase tracking-wider mb-2">Tags (comma separated)</label>
                    <input type="text" name="tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                      className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#f3a847] transition-colors bg-white" placeholder="gold, bracelet, luxury"/>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-[#131921] uppercase tracking-wider mb-2">Description</label>
                    <textarea name="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                      className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#f3a847] transition-colors bg-white resize-none" placeholder="Product description..."/>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-[#131921] uppercase tracking-wider mb-2">Colors</label>
                    <div className="flex items-center gap-3 mb-2">
                      <input type="color" value={colorInput} onChange={(e) => setColorInput(e.target.value)} className="w-10 h-10 border border-gray-200 cursor-pointer"/>
                      <button type="button" onClick={() => { if (!colors.includes(colorInput)) setColors([...colors, colorInput]); }}
                        className="bg-[#131921] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 hover:bg-[#232f3e] transition-colors">
                        Add Color
                      </button>
                    </div>
                    <div className="flex gap-2">
                      {colors.map((c, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <span className="w-6 h-6 border border-gray-200" style={{ backgroundColor: c }}/>
                          <button type="button" onClick={() => setColors(colors.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 text-xs">×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-[#131921] uppercase tracking-wider mb-2">Product Image</label>
                    <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); } }} required
                      className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#f3a847] bg-white"/>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="mt-3 bg-gray-100 h-1.5">
                        <div className="bg-[#f3a847] h-full transition-all" style={{ width: `${uploadProgress}%` }}/>
                      </div>
                    )}
                    {imagePreview && (
                      <div className="mt-3">
                        <img src={imagePreview} alt="preview" className="w-24 h-24 object-cover border border-gray-200"/>
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <button type="submit" disabled={loading}
                      className="bg-[#f3a847] hover:bg-[#e8a020] disabled:bg-gray-300 text-black font-bold px-8 py-3 transition-colors text-xs tracking-[0.3em] uppercase">
                      {loading ? 'Uploading...' : 'Add Product'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Product List */}
              <div className="bg-white p-6 border border-gray-100">
                <h3 className="text-sm font-bold text-[#131921] uppercase tracking-wider mb-4">All Products ({products.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left">
                        <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Image</th>
                        <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Name</th>
                        <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Category</th>
                        <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Price</th>
                        <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Stock</th>
                        <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.id} className="border-b border-gray-50 last:border-0">
                          <td className="py-3"><img src={p.image} alt="" className="w-10 h-10 object-cover"/></td>
                          <td className="py-3 font-medium text-[#131921]">{p.title}</td>
                          <td className="py-3 text-gray-500">{p.category}</td>
                          <td className="py-3 font-semibold text-[#131921]">Rs. {p.price?.toLocaleString()}</td>
                          <td className="py-3 text-gray-500">{p.stock ?? '—'}</td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => openEditModal(p)} className="text-blue-500 hover:text-blue-700 transition-colors">
                                <Pencil size={16}/>
                              </button>
                              <button onClick={() => deleteProduct(p.id)} className="text-red-500 hover:text-red-700 transition-colors">
                                <Trash2 size={16}/>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {products.length === 0 && <p className="text-gray-400 text-xs py-4">No products found</p>}
                </div>
              </div>
            </div>
          )}

          {/* ═══════ MANAGE ORDERS ═══════ */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                {['all', 'pending', 'processing', 'shipped', 'delivered'].map((f) => (
                  <button key={f} onClick={() => setOrderFilter(f)}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                      orderFilter === f ? 'bg-[#131921] text-[#f3a847]' : 'bg-white border border-gray-200 text-gray-500 hover:text-[#131921]'
                    }`}>
                    {f}
                  </button>
                ))}
              </div>

              <div className="bg-white border border-gray-100 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f9f9f9] text-left">
                      <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Order ID</th>
                      <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Customer</th>
                      <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Product</th>
                      <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Total</th>
                      <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Payment</th>
                      <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Receipt</th>
                      <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-3 font-medium text-[#131921]">#{order.id.slice(0, 8).toUpperCase()}</td>
                        <td className="px-4 py-3">
                          <p className="text-[#131921] font-medium">{order.customerDetails?.firstName} {order.customerDetails?.lastName}</p>
                          <p className="text-gray-400 text-[10px]">{order.customerDetails?.phone}</p>
                        </td>
                        <td className="px-4 py-3">
                          {order.items?.map((item, i) => (
                            <p key={i} className="text-gray-600 text-xs">{item.title}</p>
                          ))}
                        </td>
                        <td className="px-4 py-3 font-bold text-[#131921]">Rs. {order.total?.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] uppercase tracking-wider text-gray-500">{order.paymentMethod}</span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={order.orderStatus || 'pending'}
                            onChange={(e) => updateOrderStatus(order, e.target.value)}
                            className="text-xs border border-gray-200 px-2 py-1 outline-none focus:border-[#f3a847] bg-white"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          {order.receiptURL ? (
                            <button onClick={() => setSelectedReceipt(order.receiptURL)} className="text-[#f3a847] hover:text-[#e8a020] text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                              <Eye size={12}/> View
                            </button>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 relative">
                          <button
                            onClick={() => setOpenActionMenu(openActionMenu === order.id ? null : order.id)}
                            className="text-gray-400 hover:text-[#131921] transition-colors p-1"
                          >
                            <MoreVertical size={18}/>
                          </button>
                          {openActionMenu === order.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenActionMenu(null)}/>
                              <div className="absolute right-4 top-full mt-1 w-40 bg-white border border-gray-100 shadow-lg z-20 py-1">
                                {order.paymentMethod && PAYMENT_METHODS.includes(order.paymentMethod) && order.paymentStatus !== 'verified' && (
                                  <button
                                    onClick={() => { verifyPayment(order); setOpenActionMenu(null); }}
                                    className="w-full text-left px-4 py-2.5 text-xs font-medium text-green-600 hover:bg-green-50 flex items-center gap-2 transition-colors"
                                  >
                                    <CheckCircle size={14}/> Verify Payment
                                  </button>
                                )}
                                {order.paymentStatus === 'verified' && (
                                  <div className="px-4 py-2.5 text-xs font-medium text-green-600 flex items-center gap-2">
                                    <CheckCircle size={14}/> Verified
                                  </div>
                                )}
                                <button
                                  onClick={() => { deleteOrder(order.id); setOpenActionMenu(null); }}
                                  className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                >
                                  <Trash2 size={14}/> Delete Order
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredOrders.length === 0 && <p className="text-gray-400 text-xs text-center py-8">No orders found</p>}
              </div>
            </div>
          )}

          {/* ═══════ SETTINGS ═══════ */}
          {activeTab === 'settings' && (
            <div className="max-w-3xl">
              {/* Settings Header */}
              <div className="bg-white border border-gray-100 p-8 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#131921] flex items-center justify-center shrink-0">
                    <Settings size={20} className="text-[#f3a847]"/>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#131921] uppercase tracking-wider">Payment Accounts</h3>
                    <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                      Configure your manual wallet payment details. These accounts will be displayed to customers at checkout for JazzCash, Easypaisa, and NayaPay transfers.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={saveSettings} className="space-y-6">
                {/* JazzCash */}
                <div className="bg-white border-l-4 border-l-[#d32f2f] border-y border-r border-gray-100">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-red-50 flex items-center justify-center">
                        <Smartphone size={18} className="text-[#d32f2f]"/>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#131921] uppercase tracking-wider">JazzCash</h4>
                        <p className="text-gray-400 text-xs">Mobile wallet payment account</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-[#131921] uppercase tracking-wider mb-2">Account Title</label>
                        <input type="text" value={settings.jazzcash?.accountName || ''}
                          onChange={(e) => setSettings({ ...settings, jazzcash: { ...settings.jazzcash, accountName: e.target.value } })}
                          className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#d32f2f] focus:ring-1 focus:ring-[#d32f2f]/20 transition-all bg-white" placeholder="e.g. Twistora Store"/>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#131921] uppercase tracking-wider mb-2">Mobile Number</label>
                        <input type="text" value={settings.jazzcash?.accountNumber || ''}
                          onChange={(e) => setSettings({ ...settings, jazzcash: { ...settings.jazzcash, accountNumber: e.target.value } })}
                          className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#d32f2f] focus:ring-1 focus:ring-[#d32f2f]/20 transition-all bg-white" placeholder="03XX XXXXXXX"/>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Easypaisa */}
                <div className="bg-white border-l-4 border-l-[#43a047] border-y border-r border-gray-100">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-green-50 flex items-center justify-center">
                        <Wallet size={18} className="text-[#43a047]"/>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#131921] uppercase tracking-wider">Easypaisa</h4>
                        <p className="text-gray-400 text-xs">Mobile wallet payment account</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-[#131921] uppercase tracking-wider mb-2">Account Title</label>
                        <input type="text" value={settings.easypaisa?.accountName || ''}
                          onChange={(e) => setSettings({ ...settings, easypaisa: { ...settings.easypaisa, accountName: e.target.value } })}
                          className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#43a047] focus:ring-1 focus:ring-[#43a047]/20 transition-all bg-white" placeholder="e.g. Twistora Store"/>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#131921] uppercase tracking-wider mb-2">Mobile Number</label>
                        <input type="text" value={settings.easypaisa?.accountNumber || ''}
                          onChange={(e) => setSettings({ ...settings, easypaisa: { ...settings.easypaisa, accountNumber: e.target.value } })}
                          className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#43a047] focus:ring-1 focus:ring-[#43a047]/20 transition-all bg-white" placeholder="03XX XXXXXXX"/>
                      </div>
                    </div>
                  </div>
                </div>

                {/* NayaPay */}
                <div className="bg-white border-l-4 border-l-[#7b1fa2] border-y border-r border-gray-100">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-purple-50 flex items-center justify-center">
                        <CreditCard size={18} className="text-[#7b1fa2]"/>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#131921] uppercase tracking-wider">NayaPay</h4>
                        <p className="text-gray-400 text-xs">Mobile wallet payment account</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-[#131921] uppercase tracking-wider mb-2">Account Title</label>
                        <input type="text" value={settings.nayapay?.accountName || ''}
                          onChange={(e) => setSettings({ ...settings, nayapay: { ...settings.nayapay, accountName: e.target.value } })}
                          className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#7b1fa2] focus:ring-1 focus:ring-[#7b1fa2]/20 transition-all bg-white" placeholder="e.g. Twistora Store"/>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#131921] uppercase tracking-wider mb-2">Mobile Number</label>
                        <input type="text" value={settings.nayapay?.accountNumber || ''}
                          onChange={(e) => setSettings({ ...settings, nayapay: { ...settings.nayapay, accountNumber: e.target.value } })}
                          className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#7b1fa2] focus:ring-1 focus:ring-[#7b1fa2]/20 transition-all bg-white" placeholder="03XX XXXXXXX"/>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="bg-white border border-gray-100 p-6 flex items-center justify-between">
                  <p className="text-gray-400 text-xs">Make sure all details are correct before saving.</p>
                  <button type="submit" className="bg-[#131921] hover:bg-[#232f3e] text-white font-bold px-10 py-3.5 transition-colors text-xs tracking-[0.3em] uppercase">
                    Save Settings
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white max-w-sm w-full p-6 border border-gray-100 shadow-xl">
            <h3 className="text-lg font-bold text-[#131921] mb-2">{confirmModal.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">{confirmModal.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmModal({ open: false, title: '', message: '', onConfirm: null })}
                className="border border-gray-200 text-gray-600 font-bold px-6 py-2.5 transition-colors text-xs tracking-[0.2em] uppercase hover:bg-gray-50"
              >
                No
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-2.5 transition-colors text-xs tracking-[0.2em] uppercase"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSelectedReceipt(null)}>
          <div className="bg-white p-2 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end mb-2">
              <button onClick={() => setSelectedReceipt(null)} className="text-gray-400 hover:text-[#131921]"><X size={18}/></button>
            </div>
            <img src={selectedReceipt} alt="Receipt" className="w-full"/>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={closeEditModal}>
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-sm font-bold text-[#131921] uppercase tracking-wider">Edit Product</h3>
              <button onClick={closeEditModal} className="text-gray-400 hover:text-[#131921]"><X size={18}/></button>
            </div>
            <form onSubmit={saveEditProduct} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-[#131921] uppercase tracking-wider mb-2">Product Name</label>
                <input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required
                  className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#f3a847] transition-colors bg-white"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#131921] uppercase tracking-wider mb-2">Category</label>
                <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} required
                  className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#f3a847] transition-colors bg-white">
                  <option value="">Select category</option>
                  {['Gold', 'Silver', 'Diamond', 'Charms', 'Bangles', 'Beaded', 'Couples'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#131921] uppercase tracking-wider mb-2">Price (Rs.)</label>
                <input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} required
                  className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#f3a847] transition-colors bg-white"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#131921] uppercase tracking-wider mb-2">Sale Price (Optional)</label>
                <input type="number" value={editForm.salePrice} onChange={(e) => setEditForm({ ...editForm, salePrice: e.target.value })}
                  className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#f3a847] transition-colors bg-white"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#131921] uppercase tracking-wider mb-2">Rating (1-5)</label>
                <input type="number" value={editForm.rating} onChange={(e) => setEditForm({ ...editForm, rating: e.target.value })} min="1" max="5" step="0.1" required
                  className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#f3a847] transition-colors bg-white"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#131921] uppercase tracking-wider mb-2">Stock Quantity</label>
                <input type="number" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                  className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#f3a847] transition-colors bg-white"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#131921] uppercase tracking-wider mb-2">Material</label>
                <input type="text" value={editForm.material} onChange={(e) => setEditForm({ ...editForm, material: e.target.value })}
                  className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#f3a847] transition-colors bg-white"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#131921] uppercase tracking-wider mb-2">SKU</label>
                <input type="text" value={editForm.sku} onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                  className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#f3a847] transition-colors bg-white"/>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#131921] uppercase tracking-wider mb-2">Tags (comma separated)</label>
                <input type="text" value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                  className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#f3a847] transition-colors bg-white"/>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#131921] uppercase tracking-wider mb-2">Description</label>
                <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3}
                  className="w-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#f3a847] transition-colors bg-white resize-none"/>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#131921] uppercase tracking-wider mb-2">Colors</label>
                <div className="flex items-center gap-3 mb-2">
                  <input type="color" value={editColorInput} onChange={(e) => setEditColorInput(e.target.value)} className="w-10 h-10 border border-gray-200 cursor-pointer"/>
                  <button type="button" onClick={() => { if (!editColors.includes(editColorInput)) setEditColors([...editColors, editColorInput]); }}
                    className="bg-[#131921] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 hover:bg-[#232f3e] transition-colors">
                    Add Color
                  </button>
                </div>
                <div className="flex gap-2">
                  {editColors.map((c, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="w-6 h-6 border border-gray-200" style={{ backgroundColor: c }}/>
                      <button type="button" onClick={() => setEditColors(editColors.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 text-xs">×</button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#131921] uppercase tracking-wider mb-2">Current Image</label>
                <img src={editForm.image} alt="Current" className="w-24 h-24 object-cover border border-gray-200 mb-2"/>
                <p className="text-gray-400 text-xs">Image cannot be changed in edit mode. Delete and re-add the product to change the image.</p>
              </div>
              <div className="md:col-span-2 flex justify-end gap-3">
                <button type="button" onClick={closeEditModal}
                  className="border border-gray-200 text-gray-600 font-bold px-6 py-3 transition-colors text-xs tracking-[0.2em] uppercase hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit"
                  className="bg-[#f3a847] hover:bg-[#e8a020] text-black font-bold px-8 py-3 transition-colors text-xs tracking-[0.3em] uppercase">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
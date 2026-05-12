import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header/Header';
import Home from './components/Home/Home';
import Basket from './components/Basket/Basket';
import Login from './components/Login/Login';
import Payment from './components/Payment/Payment';
import Checkout from './components/Checkout/Checkout';
import AdminLogin from './components/Admin/AdminLogin';
import Admin from './components/Admin/Admin';
import Orders from './components/Orders/Orders';
import OrderSuccess from './components/Orders/OrderSuccess';
import Shop from './components/Shop/Shop';
import ProductDetail from './components/Product/ProductDetail';

import About from './components/About/About';
import Contact from './components/Contact/Contact';

import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useStateValue } from './StateContext';

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname === '/admin' || location.pathname === '/admin/login';

  return (
    <>
      {!isAdminRoute && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/basket" element={<Basket />} />
        <Route path="/payment/:orderId" element={<Payment />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success/:orderId" element={<OrderSuccess />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </>
  );
}

function App() {
  const { dispatch } = useStateValue();

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      dispatch({
        type: 'SET_USER',
        user: user || null,
      });
    });
  }, []);

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStateValue } from '../../StateContext';
import { db } from '../../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

import {
  ShoppingBag, Heart, Minus, Plus, Star,
  ChevronRight, Truck, Shield, RefreshCw
} from 'lucide-react';
import ProductCard from './ProductCard';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dispatch } = useStateValue();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [wishlisted, setWishlisted] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setProduct(data);
if (data.variants?.length > 0) {
  setSelectedVariant(data.variants[0]);
}
          // Fetch related products
          const allSnap = await getDocs(collection(db, 'products'));
          const all = allSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          const related = all
            .filter((p) => p.id !== data.id && p.category === data.category)
            .slice(0, 3);
          setRelatedProducts(related);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

 const addToBasket = () => {
  for (let i = 0; i < quantity; i++) {
    dispatch({
      type: 'ADD_TO_BASKET',
      item: {
        ...product,
        selectedVariant: selectedVariant || null,
        image: selectedVariant?.image || product.image
      },
    });
  }
};

  // Build image gallery from product image + optional extra images
 const images = selectedVariant
  ? [selectedVariant.image]
  : product?.images?.length
    ? product.images
    : product?.image
      ? [product.image]
      : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#f3a847] border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <p className="text-gray-400 text-sm mb-4">Product not found</p>
        <button
          onClick={() => navigate('/shop')}
          className="text-[#f3a847] text-xs font-bold uppercase tracking-[0.2em] underline"
        >
          Back to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* ── BREADCRUMB ── */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-gray-400 text-[11px] tracking-[0.15em] uppercase">
            <Link to="/" className="hover:text-[#131921] transition-colors">Home</Link>
            <ChevronRight size={10}/>
            <Link to="/shop" className="hover:text-[#131921] transition-colors">Shop</Link>
            <ChevronRight size={10}/>
            <span className="text-[#131921]">{product.title}</span>
          </div>
        </div>
      </div>

      {/* ── PRODUCT MAIN ── */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

          {/* Image Gallery */}
          <div className="flex gap-4">
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex flex-col gap-3 shrink-0">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-16 h-16 border overflow-hidden transition-all duration-300 ${
                      activeImage === i ? 'border-[#f3a847] ring-1 ring-[#f3a847]' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover"/>
                  </button>
                ))}
              </div>
            )}
            {/* Main Image */}
            <div className="flex-1 bg-[#f9f9f9] aspect-square overflow-hidden relative group">
              <img
                src={images[activeImage]}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>

          {/* Product Info */}
          <div>
            <p className="text-[#f3a847] text-[10px] uppercase tracking-[0.3em] mb-3">{product.category}</p>
            <h1 className="text-3xl md:text-4xl font-bold text-[#131921] mb-4 leading-tight">{product.title}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={i < Math.floor(product.rating || 0) ? 'text-[#f3a847] fill-[#f3a847]' : 'text-gray-200 fill-gray-200'}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-400">({product.rating || 0})</span>
            </div>

            {/* Price */}
            <p className="text-2xl font-bold text-[#131921] mb-6">
              Rs. {product.price?.toLocaleString()}
            </p>

            {/* Description */}
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              {product.description || 'Handcrafted with precision and care, this exquisite bracelet adds a touch of elegance to any ensemble. Made from premium materials with a timeless design that transcends trends.'}
            </p>
            {product.variants?.length > 0 && (
  <div className="mb-6">
    <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">
      Select Color
    </p>

    <div className="flex gap-3">
      {product.variants.map((variant, i) => (
        <button
          key={i}
          onClick={() => {
            setSelectedVariant(variant);
            setActiveImage(0);
          }}
          className={`px-4 py-2 border text-xs uppercase tracking-wider transition ${
            selectedVariant?.color === variant.color
              ? 'border-[#f3a847] bg-[#f3a847] text-black'
              : 'border-gray-200 text-gray-500 hover:border-[#131921]'
          }`}
        >
          {variant.color}
        </button>
      ))}
    </div>
  </div>
)}

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-xs text-gray-500 uppercase tracking-widest">Quantity</span>
              <div className="flex items-center border border-gray-200">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-[#131921] transition-colors"
                >
                  <Minus size={14}/>
                </button>
                <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-[#131921] transition-colors"
                >
                  <Plus size={14}/>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <button
                onClick={addToBasket}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#f3a847] hover:bg-[#e8a020] text-black font-bold px-10 py-4 transition-all duration-300 text-xs tracking-[0.3em] uppercase hover:shadow-lg hover:shadow-[#f3a847]/20 hover:-translate-y-0.5"
              >
                <ShoppingBag size={14}/>
                Add to Basket
              </button>
              <button
                onClick={() => setWishlisted(!wishlisted)}
                className={`w-14 h-14 flex items-center justify-center border transition-all duration-300 ${
                  wishlisted ? 'bg-[#131921] border-[#131921] text-white' : 'border-gray-200 text-gray-400 hover:text-[#131921] hover:border-[#131921]'
                }`}
              >
                <Heart size={18} className={wishlisted ? 'fill-white' : ''}/>
              </button>
            </div>

            {/* Meta */}
            <div className="space-y-2 text-xs text-gray-400">
              <p><span className="text-[#131921] font-semibold">SKU:</span> {product.sku || `TW-${product.id.slice(0, 6).toUpperCase()}`}</p>
              <p><span className="text-[#131921] font-semibold">Category:</span> {product.category}</p>
              {product.tags && <p><span className="text-[#131921] font-semibold">Tags:</span> {product.tags}</p>}
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-100">
              {[
                { icon: <Truck size={16} className="text-[#f3a847]"/>, text: 'Free Delivery' },
                { icon: <Shield size={16} className="text-[#f3a847]"/>, text: 'Premium Quality' },
                { icon: <RefreshCw size={16} className="text-[#f3a847]"/>, text: 'Easy Returns' },
              ].map((badge) => (
                <div key={badge.text} className="flex flex-col items-center gap-2 text-center">
                  {badge.icon}
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TABS ── */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="border-b border-gray-100 mb-8">
          <div className="flex gap-0">
            {[
              { key: 'description', label: 'Description' },
              { key: 'additional', label: 'Additional Information' },
              { key: 'reviews', label: `Reviews (${product.reviews?.length || 0})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 text-xs font-medium tracking-widest uppercase transition-all border-b-2 ${
                  activeTab === tab.key
                    ? 'text-[#131921] border-[#f3a847]'
                    : 'text-gray-400 border-transparent hover:text-[#131921]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-3xl">
          {activeTab === 'description' && (
            <div className="animate-fade-in">
              <p className="text-gray-500 text-sm leading-relaxed mb-4">
                {product.description || 'Every bracelet from Twistora is a testament to exceptional craftsmanship. Our artisans pour their expertise and passion into each piece, ensuring that what you wear is not just an accessory, but a work of art.'}
              </p>
              <p className="text-gray-500 text-sm leading-relaxed">
                Designed for the modern individual who appreciates timeless elegance, this piece seamlessly transitions from day to night, casual to formal. The attention to detail in every link, clasp, and finish reflects our unwavering commitment to quality.
              </p>
            </div>
          )}
          {activeTab === 'additional' && (
            <div className="animate-fade-in">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    { label: 'Material', value: product.material || 'Premium Alloy / Gold Plated' },
                    { label: 'Weight', value: product.weight || '15g - 25g' },
                    { label: 'Dimensions', value: product.dimensions || 'Adjustable' },
                    { label: 'Finish', value: product.finish || 'Polished' },
                    { label: 'Care', value: 'Avoid contact with water and chemicals' },
                  ].map((row) => (
                    <tr key={row.label} className="border-b border-gray-100">
                      <td className="py-3 text-gray-500 w-40">{row.label}</td>
                      <td className="py-3 text-[#131921]">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {activeTab === 'reviews' && (
            <div className="animate-fade-in">
              {product.reviews?.length > 0 ? (
                <div className="space-y-6">
                  {product.reviews.map((review, i) => (
                    <div key={i} className="border-b border-gray-100 pb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, j) => (
                            <Star key={j} size={10} className={j < review.rating ? 'text-[#f3a847] fill-[#f3a847]' : 'text-gray-200 fill-gray-200'}/>
                          ))}
                        </div>
                        <span className="text-xs text-gray-400">— {review.author}</span>
                      </div>
                      <p className="text-gray-500 text-sm">{review.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No reviews yet. Be the first to review this bracelet.</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── RELATED PRODUCTS ── */}
      {relatedProducts.length > 0 && (
        <section className="bg-[#f9f9f9] py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <p className="text-[#f3a847] text-xs uppercase tracking-[0.4em] mb-3">You May Also Like</p>
              <h2 className="text-3xl font-bold text-[#131921]">Related Products</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} showAddToBasket={false} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default ProductDetail;

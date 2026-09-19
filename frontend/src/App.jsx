import React, { useState, useEffect } from "react";
import { 
  ShoppingCart, LayoutDashboard, Store, Tag, Sparkles, 
  AlertCircle, Search, Star, Zap, CheckCircle2, ChevronRight 
} from "lucide-react";

const API_BASE = "http://127.0.0.1:8000/api";

const CATALOG_DATABASE = [
  // Footwear & Accessories
  {
    id: 1,
    title: "Nike Air Zoom Pegasus Running Shoes",
    price: 119.99,
    originalPrice: 159.99,
    rating: 4.8,
    reviews: 1420,
    category: "Footwear",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
    crossSellCategory: "Sports & Fitness",
    tag: "Trending"
  },
  {
    id: 2,
    title: "Puma Retro Low-Top Sneakers",
    price: 64.50,
    originalPrice: 89.00,
    rating: 4.5,
    reviews: 870,
    category: "Footwear",
    image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&q=80",
    crossSellCategory: "Sports & Fitness",
    tag: "Hot Deal"
  },
  {
    id: 3,
    title: "Adidas Ultraboost Light Running Shoes",
    price: 139.00,
    originalPrice: 180.00,
    rating: 4.9,
    reviews: 2310,
    category: "Footwear",
    image: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600&q=80",
    crossSellCategory: "Sports & Fitness",
    tag: "Bestseller"
  },
  // Mobiles & Laptops
  {
    id: 4,
    title: "Apple iPhone 15 (128 GB) - Blue",
    price: 799.00,
    originalPrice: 899.00,
    rating: 4.9,
    reviews: 5820,
    category: "Mobiles",
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80",
    crossSellCategory: "Electronics Accessories",
    tag: "Top Rated"
  },
  {
    id: 5,
    title: "Samsung Galaxy S24 Ultra 5G",
    price: 1149.00,
    originalPrice: 1299.00,
    rating: 4.8,
    reviews: 3100,
    category: "Mobiles",
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80",
    crossSellCategory: "Electronics Accessories",
    tag: "Flagship"
  },
  {
    id: 6,
    title: "Apple MacBook Air 13-inch M2",
    price: 999.00,
    originalPrice: 1099.00,
    rating: 4.9,
    reviews: 4200,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80",
    crossSellCategory: "Electronics Accessories",
    tag: "Editor's Choice"
  },
  // Audio & Wearables
  {
    id: 7,
    title: "Sony WH-1000XM5 Wireless Headphones",
    price: 348.00,
    originalPrice: 399.00,
    rating: 4.9,
    reviews: 3890,
    category: "Audio",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
    crossSellCategory: "Electronics Accessories",
    tag: "Noise Cancelling"
  },
  {
    id: 8,
    title: "Apple Watch Series 9 GPS 45mm",
    price: 389.00,
    originalPrice: 429.00,
    rating: 4.8,
    reviews: 1950,
    category: "Audio",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
    crossSellCategory: "Sports & Fitness",
    tag: "Smart Wearable"
  },
  // Cross-sell Accessories
  {
    id: 9,
    title: "Anti-Blister Cushioned Sports Socks (3 Pairs)",
    price: 14.99,
    originalPrice: 24.99,
    rating: 4.7,
    reviews: 940,
    category: "Sports & Fitness",
    image: "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=600&q=80",
    crossSellCategory: "Footwear",
    tag: "Frequently Paired"
  },
  {
    id: 10,
    title: "BPA-Free Motivational Gym Water Bottle (1L)",
    price: 19.99,
    originalPrice: 29.99,
    rating: 4.6,
    reviews: 1100,
    category: "Sports & Fitness",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80",
    crossSellCategory: "Footwear",
    tag: "Essential"
  },
  {
    id: 11,
    title: "Fast-Charging Magnetic Wireless Power Bank (10,000mAh)",
    price: 39.99,
    originalPrice: 59.99,
    rating: 4.8,
    reviews: 2150,
    category: "Electronics Accessories",
    image: "https://images.unsplash.com/photo-1609592807963-380d3810143a?w=600&q=80",
    crossSellCategory: "Mobiles",
    tag: "Add-On"
  },
  {
    id: 12,
    title: "Slim Protective Clear Case with Military Drop Protection",
    price: 16.50,
    originalPrice: 25.00,
    rating: 4.7,
    reviews: 3200,
    category: "Electronics Accessories",
    image: "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&q=80",
    crossSellCategory: "Mobiles",
    tag: "Protection"
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState("store");
  const [customerId, setCustomerId] = useState(18);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState({});
  const [lastInteractedItem, setLastInteractedItem] = useState(CATALOG_DATABASE[0]);
  const [notification, setNotification] = useState("");

  const [segmentData, setSegmentData] = useState({
    segment_name: "At-Risk / Inactive",
    marketing_action: "We Miss You! You haven't shopped recently — enjoy a special 25% win-back offer!",
    discount_code: "COMEBACK25",
    loyalty_discount_pct: 25,
    frequency: 2,
    recency_days: 48,
    is_inactive: true
  });

  const [adminClusters, setAdminClusters] = useState({
    total_customers: 25,
    clusters: [
      { cluster_id: 0, segment_name: "VIP Frequent Buyers", customer_count: 5, avg_recency: 4, avg_frequency: 12.4, avg_monetary: 1420.50, action: "Automatic 20% loyalty tier unlocked" },
      { cluster_id: 1, segment_name: "At-Risk / Inactive", customer_count: 8, avg_recency: 52, avg_frequency: 2.1, avg_monetary: 145.20, action: "Trigger COMEBACK25 email & flash banner" },
      { cluster_id: 2, segment_name: "New Explorers", customer_count: 6, avg_recency: 6, avg_frequency: 1.0, avg_monetary: 78.00, action: "Onboarding welcome coupon" },
      { cluster_id: 3, segment_name: "Loyal Regulars", customer_count: 6, avg_recency: 18, avg_frequency: 5.6, avg_monetary: 520.80, action: "Cross-sell related accessories" },
    ]
  });

  useEffect(() => {
    // Dynamic rule based on simulated Customer ID
    if (customerId <= 5) {
      setSegmentData({
        segment_name: "VIP / Continuous Buyer",
        marketing_action: "Loyalty Tier Elite: You buy frequently with us! Unlocked 20% discount on all orders.",
        discount_code: "VIPCONTINUOUS20",
        loyalty_discount_pct: 20,
        frequency: 14,
        recency_days: 2,
        is_inactive: false
      });
    } else if (customerId <= 15) {
      setSegmentData({
        segment_name: "Regular Shopper",
        marketing_action: "Steady Buyer: 10% loyalty discount automatically applied.",
        discount_code: "LOYAL10",
        loyalty_discount_pct: 10,
        frequency: 6,
        recency_days: 12,
        is_inactive: false
      });
    } else if (customerId <= 22) {
      setSegmentData({
        segment_name: "At-Risk / Low Interaction",
        marketing_action: "We Miss You! You haven't shopped in 45+ days — take 25% off your next purchase!",
        discount_code: "COMEBACK25",
        loyalty_discount_pct: 25,
        frequency: 2,
        recency_days: 48,
        is_inactive: true
      });
    } else {
      setSegmentData({
        segment_name: "New Guest",
        marketing_action: "Welcome to FlipkartPlus! Grab 5% flat off on your first order.",
        discount_code: "WELCOME5",
        loyalty_discount_pct: 5,
        frequency: 1,
        recency_days: 3,
        is_inactive: false
      });
    }
  }, [customerId]);

  const addToCart = (product) => {
    setCart((prev) => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1,
    }));
    setLastInteractedItem(product);
    setNotification(`Added "${product.title}" to cart.`);
    setTimeout(() => setNotification(""), 3000);
  };

  const categories = ["All", "Footwear", "Mobiles", "Electronics", "Audio", "Sports & Fitness"];

  const filteredProducts = CATALOG_DATABASE.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const crossSellRecommendations = CATALOG_DATABASE.filter(
    (item) => item.category === lastInteractedItem.crossSellCategory || item.crossSellCategory === lastInteractedItem.category
  ).slice(0, 3);

  const cartItemsArray = Object.entries(cart).map(([id, qty]) => {
    const item = CATALOG_DATABASE.find((p) => p.id === parseInt(id));
    return { ...item, qty };
  });

  const rawTotal = cartItemsArray.reduce((acc, curr) => acc + (curr?.price || 0) * curr.qty, 0);
  const discountAmount = (rawTotal * (segmentData.loyalty_discount_pct / 100));
  const finalTotal = Math.max(rawTotal - discountAmount, 0);

  const handleCheckout = () => {
    alert(`Order Placed Successfully!\n\nSubtotal: $${rawTotal.toFixed(2)}\nDiscount Applied (${segmentData.loyalty_discount_pct}%): -$${discountAmount.toFixed(2)}\nFinal Paid: $${finalTotal.toFixed(2)}\n\nYour behavioral profile has been updated!`);
    setCart({});
  };

  return (
    <div className="min-h-screen bg-[#f1f3f6] text-slate-900 font-sans">
      {/* Flipkart Navy-Blue Primary Header */}
      <header className="bg-[#2874f0] text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Brand Logo & Tag */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setSelectedCategory("All")}>
            <div>
              <span className="text-2xl font-black italic tracking-wide">Flipkart<span className="text-[#ffe500]">Plus</span></span>
              <div className="text-[10px] italic text-slate-200 -mt-1 flex items-center">
                Explore <span className="text-[#ffe500] font-bold mx-0.5">Plus</span>
                <Sparkles className="w-2.5 h-2.5 text-[#ffe500]" />
              </div>
            </div>
            <span className="bg-[#1c54b2] text-[#ffe500] text-[11px] font-bold px-2 py-0.5 rounded border border-[#ffe500]/30">
              ML Segmentation Engine
            </span>
          </div>

          {/* Interactive Search Bar */}
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Search for shoes, mobiles, laptops, headphones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-slate-800 text-sm pl-10 pr-4 py-2 rounded-sm focus:outline-none shadow-inner"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Views & Customer Simulation Switcher */}
          <div className="flex items-center space-x-4">
            <div className="bg-[#1c54b2] p-0.5 rounded flex">
              <button
                onClick={() => setActiveTab("store")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-bold transition ${
                  activeTab === "store" ? "bg-white text-[#2874f0]" : "text-white hover:bg-white/10"
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Storefront</span>
              </button>
              <button
                onClick={() => setActiveTab("admin")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-bold transition ${
                  activeTab === "admin" ? "bg-white text-[#2874f0]" : "text-white hover:bg-white/10"
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Admin Segmentation</span>
              </button>
            </div>

            {/* Customer Simulator Controller */}
            <div className="bg-[#ffe500] text-slate-900 px-2.5 py-1 rounded flex items-center space-x-1.5 shadow-sm">
              <span className="text-[10px] font-black uppercase">Simulate User ID:</span>
              <input
                type="number"
                min="1"
                max="25"
                value={customerId}
                onChange={(e) => setCustomerId(parseInt(e.target.value) || 1)}
                className="w-10 bg-white text-center font-bold text-xs rounded border border-slate-300 py-0.5"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Category Pills Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center space-x-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat 
                  ? "bg-[#2874f0] text-white shadow-sm" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </nav>

      {/* Main App Container */}
      <main className="max-w-7xl mx-auto p-4 md:p-6">
        
        {notification && (
          <div className="mb-4 p-3 bg-emerald-600 text-white rounded-md text-xs font-bold shadow-md flex items-center space-x-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>{notification}</span>
          </div>
        )}

        {activeTab === "store" ? (
          <div>
            {/* Dynamic Behavioral Personalization Banner */}
            <div className={`mb-6 p-5 rounded-lg shadow-md text-white flex flex-col md:flex-row justify-between items-center gap-4 transition-all duration-300 ${
              segmentData.is_inactive 
                ? "bg-gradient-to-r from-rose-700 via-red-600 to-amber-600" 
                : "bg-gradient-to-r from-[#172337] via-[#2874f0] to-[#1c54b2]"
            }`}>
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm">
                  {segmentData.is_inactive ? <AlertCircle className="w-8 h-8 text-[#ffe500]" /> : <Zap className="w-8 h-8 text-[#ffe500]" />}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-[#ffe500] text-slate-900 px-2 py-0.5 rounded">
                      {segmentData.segment_name}
                    </span>
                    <span className="text-xs text-white/80">
                      Purchases: {segmentData.frequency} | Last Active: {segmentData.recency_days} days ago
                    </span>
                  </div>
                  <h2 className="text-lg font-extrabold mt-1">{segmentData.marketing_action}</h2>
                </div>
              </div>

              <div className="bg-white/10 border border-white/20 backdrop-blur-md px-4 py-2.5 rounded-lg flex items-center space-x-3">
                <Tag className="w-6 h-6 text-[#ffe500]" />
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-200">Exclusive Auto-Coupon</div>
                  <div className="font-mono font-black text-sm text-[#ffe500] tracking-wider">{segmentData.discount_code}</div>
                </div>
                <div className="bg-[#ffe500] text-slate-900 font-black text-xs px-2 py-1 rounded">
                  {segmentData.loyalty_discount_pct}% OFF
                </div>
              </div>
            </div>

            {/* Dynamic Interactive Cross-Sell Bar (Flipkart "Frequently Bought Together") */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-[#2874f0]" />
                  <h3 className="font-bold text-slate-800 text-sm md:text-base">
                    Frequently Bought With <span className="text-[#2874f0]">"{lastInteractedItem.title}"</span>
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Smart Complementary Add-ons</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {crossSellRecommendations.map((rec) => (
                  <div key={rec.id} className="flex items-center space-x-3 p-3 border border-slate-100 rounded-lg hover:border-[#2874f0] bg-slate-50/50 transition">
                    <img src={rec.image} alt={rec.title} className="w-16 h-16 object-cover rounded shadow-sm" />
                    <div className="flex-grow">
                      <span className="text-[9px] uppercase font-bold text-[#2874f0] bg-blue-50 px-1.5 py-0.5 rounded">
                        {rec.tag}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1 mt-1">{rec.title}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm font-extrabold text-slate-900">${rec.price}</span>
                        <span className="text-xs text-slate-400 line-through">${rec.originalPrice}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => addToCart(rec)}
                      className="bg-[#2874f0] hover:bg-[#1c54b2] text-white text-xs font-bold px-3 py-2 rounded shadow-sm transition"
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Product Catalog Section */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-black text-slate-800 tracking-tight">
                {selectedCategory === "All" ? "Trending Flipkart Deals" : `${selectedCategory} Collection`}
              </h2>
              <span className="text-xs text-slate-500">{filteredProducts.length} items found</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
              {filteredProducts.map((p) => (
                <div 
                  key={p.id} 
                  onClick={() => setLastInteractedItem(p)}
                  className={`bg-white rounded-lg border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between cursor-pointer group ${
                    lastInteractedItem.id === p.id ? "border-[#2874f0] ring-1 ring-[#2874f0]" : "border-slate-200"
                  }`}
                >
                  <div className="relative overflow-hidden h-48 bg-slate-100">
                    <img 
                      src={p.image} 
                      alt={p.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                    />
                    <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      {p.category}
                    </span>
                    <span className="absolute top-2 right-2 bg-[#ffe500] text-slate-900 text-[10px] font-black px-2 py-0.5 rounded shadow-sm">
                      {p.tag}
                    </span>
                  </div>

                  <div className="p-4 flex flex-col flex-grow justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm line-clamp-2 leading-snug group-hover:text-[#2874f0] transition">
                        {p.title}
                      </h3>
                      
                      <div className="flex items-center space-x-1 mt-2">
                        <span className="bg-[#388e3c] text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center">
                          {p.rating} <Star className="w-2.5 h-2.5 fill-current ml-0.5" />
                        </span>
                        <span className="text-[11px] text-slate-400">({p.reviews})</span>
                      </div>

                      <div className="flex items-baseline space-x-2 mt-2">
                        <span className="text-lg font-black text-slate-900">${p.price}</span>
                        <span className="text-xs text-slate-400 line-through">${p.originalPrice}</span>
                        <span className="text-xs font-bold text-[#388e3c]">
                          {Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}% off
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(p);
                      }}
                      className="mt-4 w-full bg-[#ff9f00] hover:bg-[#f39700] text-white font-extrabold py-2 px-3 rounded text-xs uppercase tracking-wider transition shadow-sm"
                    >
                      Add To Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive Sticky Drawer for Cart */}
            {cartItemsArray.length > 0 && (
              <div className="fixed bottom-6 right-6 bg-white border border-slate-300 rounded-xl shadow-2xl p-5 w-84 z-40">
                <div className="flex items-center justify-between border-b pb-2 mb-3">
                  <div className="flex items-center space-x-2 font-bold text-slate-800">
                    <ShoppingCart className="w-5 h-5 text-[#2874f0]" />
                    <span>My Cart ({cartItemsArray.reduce((a, b) => a + b.qty, 0)})</span>
                  </div>
                  <button onClick={() => setCart({})} className="text-[11px] text-red-500 font-bold hover:underline">
                    Clear
                  </button>
                </div>

                <div className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-1">
                  {cartItemsArray.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs text-slate-700">
                      <span className="truncate w-36 font-medium">{item.title}</span>
                      <span className="text-slate-400">x{item.qty}</span>
                      <span className="font-bold text-slate-900">${(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Subtotal & Segment Applied Discount */}
                <div className="border-t pt-2 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span>${rawTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#388e3c] font-bold">
                    <span>{segmentData.segment_name} ({segmentData.loyalty_discount_pct}% Off):</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 border-t pt-1">
                    <span>Final Total:</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="mt-4 w-full bg-[#fb641b] hover:bg-[#e85a15] text-white font-black py-2.5 rounded text-xs uppercase tracking-wider transition shadow"
                >
                  Place Order
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Admin Intelligence Dashboard */
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-900">RFM Behavioral Customer Clusters</h2>
              <p className="text-xs text-slate-500 mt-0.5">Algorithmic segmentation grouping customers by purchasing habits</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {adminClusters.clusters.map((c) => (
                <div key={c.cluster_id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] font-black uppercase text-[#2874f0] tracking-wider">{c.segment_name}</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">{c.customer_count} Users</div>
                  <div className="text-xs text-slate-500 mt-1">Avg Spend: ${c.avg_monetary}</div>
                  <div className="text-[11px] text-slate-600 font-medium mt-2 border-t pt-2">{c.action}</div>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Segment Name</th>
                    <th className="p-3.5">Customers</th>
                    <th className="p-3.5">Recency (Days)</th>
                    <th className="p-3.5">Frequency (Orders)</th>
                    <th className="p-3.5">Monetary (Avg Spend)</th>
                    <th className="p-3.5">Automated Strategy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminClusters.clusters.map((c) => (
                    <tr key={c.cluster_id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold text-slate-900">{c.segment_name}</td>
                      <td className="p-3.5">{c.customer_count}</td>
                      <td className="p-3.5 text-slate-500">{c.avg_recency} days</td>
                      <td className="p-3.5 text-slate-500">{c.avg_frequency} orders</td>
                      <td className="p-3.5 font-bold text-[#2874f0]">${c.avg_monetary}</td>
                      <td className="p-3.5 text-slate-700">{c.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
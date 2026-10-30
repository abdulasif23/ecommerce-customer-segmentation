import React, { useState, useEffect } from "react";
import { 
  ShoppingCart, LayoutDashboard, Store, Tag, Sparkles, 
  AlertCircle, Search, Star, Zap, CheckCircle2, PackageCheck, 
  RefreshCw, User, Cpu, BarChart2, PieChart as PieIcon
} from "lucide-react";
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const API_BASE = "http://127.0.0.1:8000/api";

const CLUSTER_COLORS = {
  0: "#2563eb", // VIP: Blue
  1: "#dc2626", // At-Risk: Red
  2: "#16a34a", // New: Green
  3: "#d97706"  // Loyal: Amber
};

const STATIC_CATALOG = [
  { id: 1, title: "Nike Air Zoom Pegasus 40 Running Shoes", price: 119.99, original_price: 159.99, rating: 4.8, reviews: 1420, category: "Footwear", image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80", cross_sell_category: "Sports & Fitness", tag: "Trending" },
  { id: 2, title: "Puma Men Retro Low-Top Sneakers", price: 64.50, original_price: 89.00, rating: 4.5, reviews: 870, category: "Footwear", image_url: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&q=80", cross_sell_category: "Sports & Fitness", tag: "Hot Deal" },
  { id: 3, title: "Adidas Ultraboost Light Running Shoes", price: 139.00, original_price: 180.00, rating: 4.9, reviews: 2310, category: "Footwear", image_url: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600&q=80", cross_sell_category: "Sports & Fitness", tag: "Bestseller" },
  { id: 4, title: "Jordan Retro High OG Basketball Shoes", price: 179.99, original_price: 219.99, rating: 4.9, reviews: 3100, category: "Footwear", image_url: "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=600&q=80", cross_sell_category: "Sports & Fitness", tag: "Limited" },
  { id: 5, title: "Apple iPhone 15 Pro (128GB) - Blue", price: 899.00, original_price: 999.00, rating: 4.9, reviews: 5820, category: "Mobiles", image_url: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80", cross_sell_category: "Electronics Accessories", tag: "Flagship" },
  { id: 6, title: "Samsung Galaxy S24 Ultra 5G (256GB)", price: 1149.00, original_price: 1299.00, rating: 4.8, reviews: 3100, category: "Mobiles", image_url: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80", cross_sell_category: "Electronics Accessories", tag: "Top Rated" },
  { id: 7, title: "OnePlus 12 5G (Flowy Emerald)", price: 799.00, original_price: 899.00, rating: 4.7, reviews: 1840, category: "Mobiles", image_url: "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&q=80", cross_sell_category: "Electronics Accessories", tag: "Super Fast" },
  { id: 8, title: "Apple MacBook Air 13-inch M2", price: 999.00, original_price: 1099.00, rating: 4.9, reviews: 4200, category: "Laptops", image_url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80", cross_sell_category: "Electronics Accessories", tag: "Editor Choice" },
  { id: 9, title: "Dell XPS 15 OLED Laptop", price: 1399.00, original_price: 1599.00, rating: 4.7, reviews: 1230, category: "Laptops", image_url: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&q=80", cross_sell_category: "Electronics Accessories", tag: "Performance" },
  { id: 10, title: "Sony WH-1000XM5 Headphones", price: 348.00, original_price: 399.00, rating: 4.9, reviews: 3890, category: "Audio", image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80", cross_sell_category: "Electronics Accessories", tag: "ANC Audio" },
  { id: 11, title: "Apple Watch Series 9 GPS 45mm", price: 389.00, original_price: 429.00, rating: 4.8, reviews: 1950, category: "Audio", image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80", cross_sell_category: "Sports & Fitness", tag: "Smart Health" },
  { id: 12, title: "Anti-Blister Running Socks (3 Pairs)", price: 14.99, original_price: 24.99, rating: 4.7, reviews: 940, category: "Sports & Fitness", image_url: "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=600&q=80", cross_sell_category: "Footwear", tag: "Add-on" },
  { id: 13, title: "Gym Water Bottle (1L)", price: 19.99, original_price: 29.99, rating: 4.6, reviews: 1100, category: "Sports & Fitness", image_url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80", cross_sell_category: "Footwear", tag: "Essential" },
  { id: 14, title: "Wireless Power Bank 10,000mAh", price: 39.99, original_price: 59.99, rating: 4.8, reviews: 2150, category: "Electronics Accessories", image_url: "https://images.unsplash.com/photo-1609592807963-380d3810143a?w=600&q=80", cross_sell_category: "Mobiles", tag: "Fast Charge" },
  { id: 15, title: "Drop-Proof Slim Case", price: 16.50, original_price: 25.00, rating: 4.7, reviews: 3200, category: "Electronics Accessories", image_url: "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&q=80", cross_sell_category: "Mobiles", tag: "Protection" }
];

export default function App() {
  const [activeTab, setActiveTab] = useState("store");
  const [customerId, setCustomerId] = useState(1);
  const [customerName, setCustomerName] = useState("Shaik Abdul Asif");
  const [products, setProducts] = useState(STATIC_CATALOG);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState({});
  const [lastInteractedItem, setLastInteractedItem] = useState(STATIC_CATALOG[0]);
  const [notification, setNotification] = useState("");
  
  // Admin Data State
  const [adminOrders, setAdminOrders] = useState([]);
  const [adminClusters, setAdminClusters] = useState({ total_customers: 0, clusters: [], scatter_data: [] });
  const [isRetraining, setIsRetraining] = useState(false);

  const [segmentData, setSegmentData] = useState({
    segment_name: "VIP / Continuous Buyer",
    marketing_action: "Loyalty Tier Elite: You buy frequently with us! Unlocked 20% discount on all orders.",
    discount_code: "VIPCONTINUOUS20",
    loyalty_discount_pct: 20,
    frequency: 6,
    recency_days: 2,
    monetary: 1420.00,
    is_inactive: false
  });

  useEffect(() => {
    fetchProducts();
    fetchUserSegment();
  }, [customerId]);

  useEffect(() => {
    if (activeTab === "admin") {
      fetchAdminData();
      fetchAdminOrders();
    }
  }, [activeTab]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/products`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) setProducts(data);
      }
    } catch (err) {}
  };

  const fetchUserSegment = async () => {
    try {
      const res = await fetch(`${API_BASE}/users/${customerId}/segment`);
      if (res.ok) {
        const data = await res.json();
        setSegmentData(data);
      }
    } catch (err) {}
  };

  const fetchAdminData = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/clusters`);
      if (res.ok) {
        const data = await res.json();
        setAdminClusters(data);
      }
    } catch (err) {}
  };

  const fetchAdminOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/orders`);
      if (res.ok) {
        const data = await res.json();
        setAdminOrders(data);
      }
    } catch (err) {}
  };

  // Trigger Online ML Retraining
  const handleRetrain = async () => {
    setIsRetraining(true);
    try {
      const res = await fetch(`${API_BASE}/admin/retrain`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || "Retraining failed");
      } else {
        setNotification(`ML Pipeline: ${data.message} (Inertia: ${data.inertia})`);
        fetchAdminData();
        setTimeout(() => setNotification(""), 6000);
      }
    } catch (err) {
      alert("Failed to trigger retrain endpoint. Check backend.");
    } finally {
      setIsRetraining(false);
    }
  };

  const addToCart = (product) => {
    setCart((prev) => ({ ...prev, [product.id]: (prev[product.id] || 0) + 1 }));
    setLastInteractedItem(product);
    setNotification(`Added "${product.title}" to cart.`);
    setTimeout(() => setNotification(""), 3000);
  };

  const categories = ["All", "Footwear", "Mobiles", "Laptops", "Audio", "Sports & Fitness", "Electronics Accessories"];

  const filteredProducts = products.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const crossSellRecommendations = products.filter(
    (item) => lastInteractedItem && (item.category === lastInteractedItem.cross_sell_category)
  ).slice(0, 3);

  const cartItemsArray = Object.entries(cart).map(([id, qty]) => {
    const item = products.find((p) => p.id === parseInt(id));
    return { ...item, qty };
  }).filter(item => item && item.price !== undefined);

  const rawTotal = cartItemsArray.reduce((acc, curr) => acc + parseFloat(curr.price) * curr.qty, 0);
  const discountAmount = rawTotal * ((segmentData?.loyalty_discount_pct || 0) / 100);
  const finalTotal = Math.max(rawTotal - discountAmount, 0);

  const handleCheckout = async () => {
    if (!customerName.trim()) {
      alert("Please enter Customer Name!");
      return;
    }

    const payloadItems = Object.entries(cart).map(([pId, qty]) => ({
      product_id: parseInt(pId),
      quantity: qty
    }));

    if (payloadItems.length === 0) return;

    try {
      const response = await fetch(`${API_BASE}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          customer_name: customerName,
          items: payloadItems,
          discount_pct: segmentData.loyalty_discount_pct || 0.0
        })
      });

      if (!response.ok) throw new Error("Checkout failed");

      const resData = await response.json();
      setNotification(`Success! Order #${resData.order_id} recorded in MySQL for ${resData.customer_name}! Paid: $${resData.final_paid}`);
      setCart({});
      fetchUserSegment();
      if (activeTab === "admin") {
        fetchAdminOrders();
        fetchAdminData();
      }
      setTimeout(() => setNotification(""), 6000);
    } catch (err) {
      alert("Checkout error: Make sure FastAPI is on 8000 and MySQL is active on 3307.");
    }
  };

  // Custom Recharts Scatter Tooltip
  const CustomScatterTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded shadow-lg text-xs border border-slate-700">
          <p className="font-extrabold text-[#ffe500]">{data.customer_name} (ID: #{data.customer_id})</p>
          <p className="mt-1">Segment: <span className="font-bold">{data.segment_name}</span></p>
          <p>Total Spent: <span className="font-bold text-emerald-400">${data.monetary}</span></p>
          <p>Recency: <span className="font-bold">{data.recency} days ago</span></p>
          <p>Frequency: <span className="font-bold">{data.frequency} orders</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#f1f3f6] text-slate-900 font-sans">
      <header className="bg-[#2874f0] text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setSelectedCategory("All")}>
            <div>
              <span className="text-2xl font-black italic tracking-wide">Flipkart<span className="text-[#ffe500]">Plus</span></span>
              <div className="text-[10px] italic text-slate-200 -mt-1 flex items-center">
                Explore <span className="text-[#ffe500] font-bold mx-0.5">Plus</span>
                <Sparkles className="w-2.5 h-2.5 text-[#ffe500]" />
              </div>
            </div>
            <span className="bg-[#1c54b2] text-[#ffe500] text-[11px] font-bold px-2 py-0.5 rounded border border-[#ffe500]/30">
              MySQL Port 3307
            </span>
          </div>

          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Search shoes, laptops, mobiles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-slate-800 text-sm pl-10 pr-4 py-2 rounded-sm focus:outline-none shadow-inner"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-[#1c54b2] p-0.5 rounded flex">
              <button
                onClick={() => setActiveTab("store")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-bold transition ${
                  activeTab === "store" ? "bg-white text-[#2874f0]" : "text-white hover:bg-white/10"
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Store</span>
              </button>
              <button
                onClick={() => setActiveTab("admin")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-bold transition ${
                  activeTab === "admin" ? "bg-white text-[#2874f0]" : "text-white hover:bg-white/10"
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Admin ML Dashboard</span>
              </button>
            </div>

            <div className="bg-[#ffe500] text-slate-900 px-3 py-1 rounded flex items-center space-x-2 shadow-sm text-xs">
              <span className="font-black">ID:</span>
              <input
                type="number"
                min="1"
                max="50"
                value={customerId}
                onChange={(e) => setCustomerId(parseInt(e.target.value) || 1)}
                className="w-10 bg-white text-center font-bold rounded border py-0.5 text-slate-900"
              />
              <span className="font-black">Name:</span>
              <input
                type="text"
                placeholder="Enter Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-32 bg-white px-2 font-bold rounded border py-0.5 text-slate-900"
              />
            </div>
          </div>
        </div>
      </header>

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

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {notification && (
          <div className="mb-4 p-3 bg-emerald-600 text-white rounded-md text-xs font-bold shadow-md flex items-center space-x-2 animate-pulse">
            <CheckCircle2 className="w-5 h-5" />
            <span>{notification}</span>
          </div>
        )}

        {activeTab === "store" ? (
          <div>
            {segmentData && (
              <div className={`mb-6 p-5 rounded-lg shadow-md text-white flex flex-col md:flex-row justify-between items-center gap-4 ${
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
                        Orders: {segmentData.frequency} | Recency: {segmentData.recency_days} days
                      </span>
                    </div>
                    <h2 className="text-lg font-extrabold mt-1">{segmentData.marketing_action}</h2>
                  </div>
                </div>

                <div className="bg-white/10 border border-white/20 backdrop-blur-md px-4 py-2.5 rounded-lg flex items-center space-x-3">
                  <Tag className="w-6 h-6 text-[#ffe500]" />
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-200">Applied Discount</div>
                    <div className="font-mono font-black text-sm text-[#ffe500]">{segmentData.discount_code}</div>
                  </div>
                  <div className="bg-[#ffe500] text-slate-900 font-black text-xs px-2 py-1 rounded">
                    {segmentData.loyalty_discount_pct}% OFF
                  </div>
                </div>
              </div>
            )}

            {lastInteractedItem && crossSellRecommendations.length > 0 && (
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-[#2874f0]" />
                    <h3 className="font-bold text-slate-800 text-sm md:text-base">
                      Frequently Bought With <span className="text-[#2874f0]">"{lastInteractedItem.title}"</span>
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Smart Add-ons</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {crossSellRecommendations.map((rec) => (
                    <div key={rec.id} className="flex items-center space-x-3 p-3 border border-slate-100 rounded-lg hover:border-[#2874f0] bg-slate-50/50 transition">
                      <img src={rec.image_url} alt={rec.title} className="w-16 h-16 object-cover rounded shadow-sm" />
                      <div className="flex-grow">
                        <span className="text-[9px] uppercase font-bold text-[#2874f0] bg-blue-50 px-1.5 py-0.5 rounded">
                          {rec.tag}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1 mt-1">{rec.title}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm font-extrabold text-slate-900">${parseFloat(rec.price).toFixed(2)}</span>
                          <span className="text-xs text-slate-400 line-through">${parseFloat(rec.original_price).toFixed(2)}</span>
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
            )}

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-black text-slate-800 tracking-tight">
                {selectedCategory === "All" ? "Featured Products" : `${selectedCategory} Collection`}
              </h2>
              <span className="text-xs text-slate-500">{filteredProducts.length} items available</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
              {filteredProducts.map((p) => (
                <div 
                  key={p.id} 
                  onClick={() => setLastInteractedItem(p)}
                  className={`bg-white rounded-lg border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between cursor-pointer group ${
                    lastInteractedItem?.id === p.id ? "border-[#2874f0] ring-1 ring-[#2874f0]" : "border-slate-200"
                  }`}
                >
                  <div className="relative overflow-hidden h-48 bg-slate-100">
                    <img 
                      src={p.image_url} 
                      alt={p.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                    />
                    <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded">
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
                        <span className="text-lg font-black text-slate-900">${parseFloat(p.price).toFixed(2)}</span>
                        <span className="text-xs text-slate-400 line-through">${parseFloat(p.original_price).toFixed(2)}</span>
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

            {cartItemsArray.length > 0 && (
              <div className="fixed bottom-6 right-6 bg-white border border-slate-300 rounded-xl shadow-2xl p-5 w-84 z-40">
                <div className="flex items-center justify-between border-b pb-2 mb-3">
                  <div className="flex items-center space-x-2 font-bold text-slate-800">
                    <ShoppingCart className="w-5 h-5 text-[#2874f0]" />
                    <span>My Cart ({cartItemsArray.reduce((a, b) => a + b.qty, 0)} items)</span>
                  </div>
                  <button onClick={() => setCart({})} className="text-[11px] text-red-500 font-bold hover:underline">
                    Clear
                  </button>
                </div>

                <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs flex items-center space-x-2">
                  <User className="w-4 h-4 text-[#2874f0]" />
                  <span className="font-semibold text-slate-700">Ordering as: <strong>{customerName}</strong> (ID: #{customerId})</span>
                </div>

                <div className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-1">
                  {cartItemsArray.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs text-slate-700">
                      <span className="truncate w-36 font-medium">{item.title}</span>
                      <span className="text-slate-400">x{item.qty}</span>
                      <span className="font-bold text-slate-900">${(parseFloat(item.price) * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-2 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span>${rawTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#388e3c] font-bold">
                    <span>Discount ({segmentData.loyalty_discount_pct}%):</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 border-t pt-1">
                    <span>Final Amount:</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="mt-4 w-full bg-[#fb641b] hover:bg-[#e85a15] text-white font-black py-2.5 rounded text-xs uppercase tracking-wider transition shadow flex justify-center items-center space-x-2"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Place Order (Saves in MySQL)</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ADMIN ML DASHBOARD VIEW */
          <div className="space-y-6">
            
            {/* Control Bar with Retraining Trigger */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
                  <Cpu className="w-6 h-6 text-[#2874f0]" />
                  <span>K-Means RFM Analytics & Clustering Engine</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time segmentation modeling over {adminClusters.total_customers} tracked customers in MySQL
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRetrain}
                  disabled={isRetraining}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md font-bold text-xs uppercase tracking-wider text-white transition shadow-sm ${
                    isRetraining 
                      ? "bg-slate-400 cursor-not-allowed" 
                      : "bg-[#2874f0] hover:bg-[#1c54b2]"
                  }`}
                >
                  <Cpu className={`w-4 h-4 ${isRetraining ? "animate-spin" : ""}`} />
                  <span>{isRetraining ? "Retraining K-Means..." : "Retrain K-Means Model"}</span>
                </button>

                <button
                  onClick={() => { fetchAdminData(); fetchAdminOrders(); }}
                  className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded border border-slate-300 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* VISUALIZATION GRID: SCATTER PLOT & DONUT PIE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* 2D Recency vs. Monetary Scatter Plot */}
              <div className="lg:col-span-2 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b pb-2">
                  <div className="flex items-center space-x-2">
                    <BarChart2 className="w-5 h-5 text-[#2874f0]" />
                    <h3 className="font-extrabold text-slate-800 text-sm">
                      RFM Customer Centroids: Recency (Days) vs. Monetary Spend ($)
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Live Coordinates</span>
                </div>

                <div className="h-72 w-full">
                  {adminClusters.scatter_data && adminClusters.scatter_data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis 
                          type="number" 
                          dataKey="recency" 
                          name="Recency" 
                          unit=" days"
                          label={{ value: 'Recency (Days Since Last Order)', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#64748b' }}
                        />
                        <YAxis 
                          type="number" 
                          dataKey="monetary" 
                          name="Monetary" 
                          unit="$"
                          label={{ value: 'Monetary Spend ($)', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#64748b' }}
                        />
                        <Tooltip content={<CustomScatterTooltip />} />
                        {[0, 1, 2, 3].map((clusterId) => (
                          <Scatter
                            key={clusterId}
                            name={`Cluster ${clusterId}`}
                            data={adminClusters.scatter_data.filter((d) => d.cluster_id === clusterId)}
                            fill={CLUSTER_COLORS[clusterId] || "#64748b"}
                          />
                        ))}
                      </ScatterChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      No customer plot data available. Place orders to populate coordinates.
                    </div>
                  )}
                </div>
              </div>

              {/* Segment Distribution Donut Chart */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2 border-b pb-2">
                    <PieIcon className="w-5 h-5 text-[#2874f0]" />
                    <h3 className="font-extrabold text-slate-800 text-sm">Customer Share by Segment</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-4">Breakdown of behavioral clusters across active audience</p>
                </div>

                <div className="h-60 w-full">
                  {adminClusters.clusters && adminClusters.clusters.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={adminClusters.clusters}
                          dataKey="customer_count"
                          nameKey="segment_name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={4}
                        >
                          {adminClusters.clusters.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CLUSTER_COLORS[entry.cluster_id] || "#94a3b8"} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value} Users`, name]} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      No cluster summary available.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {adminClusters.clusters.map((c) => (
                <div 
                  key={c.cluster_id} 
                  className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm border-t-4"
                  style={{ borderTopColor: CLUSTER_COLORS[c.cluster_id] || "#2563eb" }}
                >
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    {c.segment_name}
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-1">{c.customer_count} Customers</div>
                  <div className="text-xs text-slate-500 mt-2 space-y-0.5">
                    <div>Avg Spend: <span className="font-bold text-slate-800">${c.avg_monetary}</span></div>
                    <div>Avg Recency: <span className="font-bold text-slate-800">{c.avg_recency} days</span></div>
                    <div>Frequency: <span className="font-bold text-slate-800">{c.avg_frequency} orders</span></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Live MySQL Database Audit Table */}
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Live Customer Orders (MySQL / XAMPP)</h2>
                  <p className="text-xs text-slate-500">Relational records stored in `orders` and `order_items` (Port 3307)</p>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Customer Details</th>
                      <th className="p-3">Purchased Products (Items & Quantities)</th>
                      <th className="p-3">Total Qty</th>
                      <th className="p-3">Subtotal</th>
                      <th className="p-3">Discount</th>
                      <th className="p-3">Final Paid</th>
                      <th className="p-3">Date / Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {adminOrders.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="p-4 text-center text-slate-400">
                          No orders loaded yet.
                        </td>
                      </tr>
                    ) : (
                      adminOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900">#{ord.id}</td>
                          <td className="p-3">
                            <div className="font-extrabold text-[#2874f0]">{ord.customer_name}</div>
                            <div className="text-[10px] text-slate-500">ID: #{ord.customer_id}</div>
                          </td>
                          <td className="p-3">
                            <div className="space-y-1">
                              {ord.items && ord.items.map((it, idx) => (
                                <div key={idx} className="text-slate-800">
                                  • <span className="font-semibold">{it.product_title}</span> <span className="font-bold text-slate-500">(x{it.quantity})</span> - ${parseFloat(it.unit_price).toFixed(2)}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="p-3 font-bold">{ord.total_items} items</td>
                          <td className="p-3 text-slate-500">${parseFloat(ord.subtotal).toFixed(2)}</td>
                          <td className="p-3 font-semibold text-[#388e3c]">
                            -${parseFloat(ord.discount_amount).toFixed(2)} ({parseFloat(ord.discount_pct).toFixed(0)}%)
                          </td>
                          <td className="p-3 font-black text-slate-900">${parseFloat(ord.final_paid).toFixed(2)}</td>
                          <td className="p-3 text-slate-500">{ord.order_date}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
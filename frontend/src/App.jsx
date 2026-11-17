import React, { useState, useEffect } from "react";
import {
  ShoppingCart, LayoutDashboard, Store, Tag, Sparkles,
  AlertCircle, Search, Star, Zap, CheckCircle2, PackageCheck,
  RefreshCw, User, Cpu, BarChart2, PieChart as PieIcon, Lock, UserPlus, X
} from "lucide-react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const API_BASE = "http://127.0.0.1:8000/api";

const CLUSTER_COLORS = {
  0: "#2563eb",
  1: "#dc2626",
  2: "#16a34a",
  3: "#d97706"
};

export default function App() {
  const [activeTab, setActiveTab] = useState("store");
  const [customerId, setCustomerId] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [isIdLocked, setIsIdLocked] = useState(false);
  const [registeredCustomers, setRegisteredCustomers] = useState([]);

  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState({});
  const [lastInteractedItem, setLastInteractedItem] = useState(null);
  const [lastPurchasedReceipt, setLastPurchasedReceipt] = useState(null);
  const [notification, setNotification] = useState("");
  const [errorBanner, setErrorBanner] = useState("");

  // Admin Data State
  const [adminOrders, setAdminOrders] = useState([]);
  const [adminClusters, setAdminClusters] = useState({ total_customers: 0, clusters: [], scatter_data: [] });
  const [isRetraining, setIsRetraining] = useState(false);

  const [segmentData, setSegmentData] = useState({
    segment_name: "New Guest",
    marketing_action: "Welcome offer! Get flat 5% off on your first order.",
    discount_code: "WELCOME5",
    loyalty_discount_pct: 5,
    frequency: 0,
    recency_days: 0,
    monetary: 0.0,
    is_inactive: false
  });

  useEffect(() => {
    fetchProducts();
    fetchRegisteredCustomers();
  }, []);

  useEffect(() => {
    fetchCustomerIdentityAndSegment(customerId);
  }, [customerId]);

  useEffect(() => {
    if (activeTab === "admin") {
      fetchAdminData();
      fetchAdminOrders();
      fetchRegisteredCustomers();
    }
  }, [activeTab]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/products`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setProducts(data);
          setLastInteractedItem((prev) => prev || data[0]);
        }
      }
    } catch (err) {}
  };

  const fetchRegisteredCustomers = async () => {
    try {
      const res = await fetch(`${API_BASE}/customers`);
      if (res.ok) {
        const data = await res.json();
        setRegisteredCustomers(data);
      }
    } catch (err) {}
  };

  const fetchCustomerIdentityAndSegment = async (idToFetch) => {
    if (!idToFetch || idToFetch < 1) return;
    try {
      const res = await fetch(`${API_BASE}/users/${idToFetch}/segment`);
      if (res.ok) {
        const data = await res.json();
        setSegmentData(data);
        if (data.is_registered && data.registered_name) {
          setCustomerName(data.registered_name);
          setIsIdLocked(true);
        } else {
          setCustomerName("");
          setIsIdLocked(false);
        }
      }
    } catch (err) {}
  };

  const handleRegisterCustomer = async () => {
    if (!customerName.trim()) {
      setErrorBanner("Please enter a name to register this Customer ID.");
      setTimeout(() => setErrorBanner(""), 4000);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/customers/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          customer_name: customerName.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorBanner(data.detail || "Could not register ID.");
        setTimeout(() => setErrorBanner(""), 5000);
        return;
      }
      setCustomerName(data.customer_name);
      setIsIdLocked(true);
      fetchRegisteredCustomers();
      setNotification(`Customer ID #${customerId} permanently registered to "${data.customer_name}" in MySQL!`);
      setTimeout(() => setNotification(""), 4000);
    } catch (err) {
      setErrorBanner("Backend connection error while registering customer.");
      setTimeout(() => setErrorBanner(""), 4000);
    }
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
    setLastPurchasedReceipt(null);
    setNotification(`Added "${product.title}" to cart.`);
    setTimeout(() => setNotification(""), 3000);
  };

  const categories = [
    "All",
    "Mobiles",
    "Mobile Accessories",
    "Laptops",
    "Laptop Accessories",
    "Footwear",
    "Sports & Fitness",
    "Audio",
    "Smartwatches"
  ];

  const filteredProducts = products.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Top Storefront Rail Recommendations
  const crossSellRecommendations = products
    .filter((item) => {
      if (!lastInteractedItem || item.id === lastInteractedItem.id) return false;
      return item.category === lastInteractedItem.cross_sell_category;
    })
    .slice(0, 4);

  const cartItemsArray = Object.entries(cart)
    .map(([id, qty]) => {
      const item = products.find((p) => p.id === parseInt(id));
      return { ...item, qty };
    })
    .filter((item) => item && item.price !== undefined);

  // Live In-Cart Recommendations based on all items currently inside the user's cart
  const cartIds = new Set(cartItemsArray.map((item) => item.id));
  const targetCrossCategories = new Set(cartItemsArray.map((item) => item.cross_sell_category));
  const inCartSuggestions = products
    .filter((p) => !cartIds.has(p.id) && targetCrossCategories.has(p.category))
    .slice(0, 3);

  const rawTotal = cartItemsArray.reduce((acc, curr) => acc + parseFloat(curr.price) * curr.qty, 0);
  const discountAmount = rawTotal * ((segmentData?.loyalty_discount_pct || 0) / 100);
  const finalTotal = Math.max(rawTotal - discountAmount, 0);

  const handleCheckout = async () => {
    if (!customerName.trim()) {
      setErrorBanner("Please enter a Customer Name to register this ID before placing an order!");
      setTimeout(() => setErrorBanner(""), 4500);
      return;
    }

    const payloadItems = Object.entries(cart).map(([pId, qty]) => ({
      product_id: parseInt(pId),
      quantity: qty
    }));

    if (payloadItems.length === 0) return;

    // Capture purchased categories before clearing cart for post-checkout recommendations
    const purchasedSnapshot = [...cartItemsArray];

    try {
      const response = await fetch(`${API_BASE}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          customer_name: customerName.trim(),
          items: payloadItems,
          discount_pct: segmentData.loyalty_discount_pct || 0.0
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        setErrorBanner(resData.detail || "Checkout blocked due to Customer ID conflict.");
        setTimeout(() => setErrorBanner(""), 5500);
        return;
      }

      const purchasedIds = new Set(purchasedSnapshot.map((i) => i.id));
      const purchasedCrossCats = new Set(purchasedSnapshot.map((i) => i.cross_sell_category));
      const postOrderRecs = products
        .filter((p) => !purchasedIds.has(p.id) && purchasedCrossCats.has(p.category))
        .slice(0, 3);

      setLastPurchasedReceipt({
        ...resData,
        purchasedItems: purchasedSnapshot,
        relatedSuggestions: postOrderRecs
      });

      setNotification(
        `Success! Order #${resData.order_id} recorded in MySQL for ${resData.customer_name} (ID #${resData.customer_id})! Paid: $${resData.final_paid}`
      );
      setCart({});
      setIsIdLocked(true);
      fetchCustomerIdentityAndSegment(customerId);
      fetchRegisteredCustomers();
      if (activeTab === "admin") {
        fetchAdminOrders();
        fetchAdminData();
      }
      setTimeout(() => setNotification(""), 6000);
    } catch (err) {
      alert("Checkout error: Make sure FastAPI is on 8000 and MySQL is active on 3307.");
    }
  };

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
              <span className="text-2xl font-black italic tracking-wide">
                Flipkart<span className="text-[#ffe500]">Plus</span>
              </span>
              <div className="text-[10px] italic text-slate-200 -mt-1 flex items-center">
                Explore <span className="text-[#ffe500] font-bold mx-0.5">Plus</span>
                <Sparkles className="w-2.5 h-2.5 text-[#ffe500]" />
              </div>
            </div>
            <span className="bg-[#1c54b2] text-[#ffe500] text-[11px] font-bold px-2 py-0.5 rounded border border-[#ffe500]/30">
              {products.length} Products • MySQL 3307
            </span>
          </div>

          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search phones, laptops, shoes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-slate-800 text-sm pl-9 pr-3 py-1.5 rounded-sm focus:outline-none shadow-inner"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
          </div>

          <div className="flex items-center space-x-2.5">
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
                max="999"
                value={customerId}
                onChange={(e) => setCustomerId(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-12 bg-white text-center font-bold rounded border py-0.5 text-slate-900"
              />
              <span className="font-black">Name:</span>
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder={isIdLocked ? "Registered" : "New Customer Name"}
                  value={customerName}
                  readOnly={isIdLocked}
                  onChange={(e) => !isIdLocked && setCustomerName(e.target.value)}
                  className={`w-36 px-2 font-bold rounded border py-0.5 ${
                    isIdLocked
                      ? "bg-slate-100 text-slate-700 border-slate-300 cursor-not-allowed pr-6"
                      : "bg-white text-slate-900 border-blue-500"
                  }`}
                />
                {isIdLocked ? (
                  <Lock
                    title={`ID #${customerId} is locked to ${customerName}`}
                    className="w-3.5 h-3.5 text-emerald-700 absolute right-1.5"
                  />
                ) : (
                  <button
                    onClick={handleRegisterCustomer}
                    title="Register this Name to ID"
                    className="ml-1 bg-[#2874f0] hover:bg-[#1c54b2] text-white px-2 py-0.5 rounded font-bold flex items-center space-x-1"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>Save</span>
                  </button>
                )}
              </div>
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
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
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
          <div className="mb-4 p-3 bg-emerald-600 text-white rounded-md text-xs font-bold shadow-md flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {errorBanner && (
          <div className="mb-4 p-3 bg-rose-600 text-white rounded-md text-xs font-bold shadow-md flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorBanner}</span>
          </div>
        )}

        {/* POST-PURCHASE ORDER RECEIPT + RELATED UPSELL SUGGESTIONS */}
        {lastPurchasedReceipt && activeTab === "store" && (
          <div className="mb-6 bg-white border-2 border-emerald-500 rounded-xl p-5 shadow-lg">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-full">
                  <PackageCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Order #{lastPurchasedReceipt.order_id} Confirmed for {lastPurchasedReceipt.customer_name}!
                  </h3>
                  <p className="text-xs text-slate-500">
                    Paid <strong>${lastPurchasedReceipt.final_paid}</strong> (Saved ${lastPurchasedReceipt.discount_amount}) •{" "}
                    Purchased:{" "}
                    <span className="font-semibold text-slate-700">
                      {lastPurchasedReceipt.purchasedItems.map((i) => i.title).join(", ")}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLastPurchasedReceipt(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {lastPurchasedReceipt.relatedSuggestions && lastPurchasedReceipt.relatedSuggestions.length > 0 && (
              <div>
                <div className="flex items-center space-x-1.5 text-xs font-black uppercase tracking-wider text-[#2874f0] mb-3">
                  <Sparkles className="w-4 h-4" />
                  <span>Recommended Add-Ons For Your Purchase</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {lastPurchasedReceipt.relatedSuggestions.map((rec) => (
                    <div
                      key={rec.id}
                      className="flex items-center space-x-3 p-2.5 bg-blue-50/50 border border-blue-100 rounded-lg"
                    >
                      <img src={rec.image_url} alt={rec.title} className="w-12 h-12 object-cover rounded shrink-0" />
                      <div className="flex-grow min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">{rec.title}</div>
                        <div className="text-xs font-black text-slate-900 mt-0.5">${parseFloat(rec.price).toFixed(2)}</div>
                      </div>
                      <button
                        onClick={() => addToCart(rec)}
                        className="bg-[#2874f0] hover:bg-[#1c54b2] text-white text-xs font-bold px-2.5 py-1.5 rounded shrink-0"
                      >
                        + Buy
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "store" ? (
          <div>
            {segmentData && (
              <div
                className={`mb-6 p-5 rounded-lg shadow-md text-white flex flex-col md:flex-row justify-between items-center gap-4 ${
                  segmentData.is_inactive
                    ? "bg-gradient-to-r from-rose-700 via-red-600 to-amber-600"
                    : "bg-gradient-to-r from-[#172337] via-[#2874f0] to-[#1c54b2]"
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm">
                    {segmentData.is_inactive ? (
                      <AlertCircle className="w-8 h-8 text-[#ffe500]" />
                    ) : (
                      <Zap className="w-8 h-8 text-[#ffe500]" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-[#ffe500] text-slate-900 px-2 py-0.5 rounded">
                        {segmentData.segment_name}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {isIdLocked
                          ? `Verified Member: ${customerName} (ID #${customerId})`
                          : `Unregistered ID #${customerId} — Enter Name & Save`}
                      </span>
                      <span className="text-xs text-white/80">
                        | Orders: {segmentData.frequency} | Recency: {segmentData.recency_days} days
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

            {/* Context-Aware Cross-Sell Recommendations Rail */}
            {lastInteractedItem && crossSellRecommendations.length > 0 && (
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-[#2874f0]" />
                    <h3 className="font-bold text-slate-800 text-sm md:text-base">
                      Recommended {lastInteractedItem.cross_sell_category} for{" "}
                      <span className="text-[#2874f0]">"{lastInteractedItem.title}"</span>
                    </h3>
                  </div>
                  <span className="text-[11px] bg-blue-50 text-[#2874f0] font-bold px-2.5 py-0.5 rounded-full">
                    Smart Related Add-ons
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {crossSellRecommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className="flex items-center space-x-3 p-3 border border-slate-100 rounded-lg hover:border-[#2874f0] bg-slate-50/60 transition"
                    >
                      <img src={rec.image_url} alt={rec.title} className="w-16 h-16 object-cover rounded shadow-sm shrink-0" />
                      <div className="flex-grow min-w-0">
                        <span className="text-[9px] uppercase font-bold text-[#2874f0] bg-blue-50 px-1.5 py-0.5 rounded">
                          {rec.tag}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-2 mt-1">{rec.title}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm font-extrabold text-slate-900">${parseFloat(rec.price).toFixed(2)}</span>
                          <span className="text-[11px] text-slate-400 line-through">
                            ${parseFloat(rec.original_price).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => addToCart(rec)}
                        className="bg-[#2874f0] hover:bg-[#1c54b2] text-white text-xs font-bold px-2.5 py-2 rounded shadow-sm transition shrink-0"
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
                {selectedCategory === "All" ? "Complete Store Catalog" : `${selectedCategory} Collection`}
              </h2>
              <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200">
                Showing {filteredProducts.length} of {products.length} items
              </span>
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
                        <span className="text-xs text-slate-400 line-through">
                          ${parseFloat(p.original_price).toFixed(2)}
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

            {/* FLOATING CART WITH LIVE IN-CART RELATED ADD-ON SUGGESTIONS */}
            {cartItemsArray.length > 0 && (
              <div className="fixed bottom-4 right-4 bg-white border border-slate-300 rounded-xl shadow-2xl p-4 w-96 max-w-[95vw] z-40">
                <div className="flex items-center justify-between border-b pb-2 mb-2.5">
                  <div className="flex items-center space-x-2 font-bold text-slate-800 text-sm">
                    <ShoppingCart className="w-4 h-4 text-[#2874f0]" />
                    <span>My Cart ({cartItemsArray.reduce((a, b) => a + b.qty, 0)} items)</span>
                  </div>
                  <button onClick={() => setCart({})} className="text-[11px] text-red-500 font-bold hover:underline">
                    Clear
                  </button>
                </div>

                <div className="mb-2.5 p-2 bg-blue-50 border border-blue-200 rounded text-xs flex items-center space-x-2">
                  <User className="w-3.5 h-3.5 text-[#2874f0]" />
                  <span className="font-semibold text-slate-700">
                    Customer: <strong>{customerName || "Unregistered"}</strong> (ID: #{customerId})
                  </span>
                </div>

                <div className="space-y-1.5 mb-3 max-h-28 overflow-y-auto pr-1">
                  {cartItemsArray.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs text-slate-700">
                      <span className="truncate w-48 font-medium">{item.title}</span>
                      <span className="text-slate-400">x{item.qty}</span>
                      <span className="font-bold text-slate-900">
                        ${(parseFloat(item.price) * item.qty).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Live Related Add-ons While Buying */}
                {inCartSuggestions.length > 0 && (
                  <div className="mb-3 p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg">
                    <div className="flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider text-amber-800 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Frequently Bought With Your Cart</span>
                    </div>
                    <div className="space-y-1.5">
                      {inCartSuggestions.map((sug) => (
                        <div
                          key={sug.id}
                          className="flex items-center justify-between bg-white p-1.5 rounded border border-amber-100 text-[11px]"
                        >
                          <div className="flex items-center space-x-2 min-w-0 pr-2">
                            <img src={sug.image_url} alt={sug.title} className="w-8 h-8 object-cover rounded shrink-0" />
                            <div className="truncate">
                              <div className="font-bold text-slate-800 truncate">{sug.title}</div>
                              <div className="text-slate-500 font-semibold">${parseFloat(sug.price).toFixed(2)}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => addToCart(sug)}
                            className="bg-[#2874f0] hover:bg-[#1c54b2] text-white font-bold px-2 py-1 rounded text-[10px] shrink-0"
                          >
                            + Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                  className="mt-3 w-full bg-[#fb641b] hover:bg-[#e85a15] text-white font-black py-2.5 rounded text-xs uppercase tracking-wider transition shadow flex justify-center items-center space-x-2"
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
                    isRetraining ? "bg-slate-400 cursor-not-allowed" : "bg-[#2874f0] hover:bg-[#1c54b2]"
                  }`}
                >
                  <Cpu className={`w-4 h-4 ${isRetraining ? "animate-spin" : ""}`} />
                  <span>{isRetraining ? "Retraining K-Means..." : "Retrain K-Means Model"}</span>
                </button>

                <button
                  onClick={() => {
                    fetchAdminData();
                    fetchAdminOrders();
                    fetchRegisteredCustomers();
                  }}
                  className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded border border-slate-300 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center space-x-1.5">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <span>Registered Customer ID Registry (1-to-1 Unique Mapping)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Each Customer ID is permanently bound to a single customer profile in MySQL
                  </p>
                </div>
                <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                  {registeredCustomers.length} Registered IDs
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {registeredCustomers.length === 0 ? (
                  <span className="text-xs text-slate-400">No customers registered yet.</span>
                ) : (
                  registeredCustomers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setCustomerId(c.id);
                        setActiveTab("store");
                      }}
                      className="flex items-center space-x-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-[#2874f0] px-3 py-1.5 rounded-md text-xs transition"
                    >
                      <span className="font-black text-[#2874f0]">ID #{c.id}</span>
                      <span className="font-bold text-slate-800">{c.name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                          label={{
                            value: "Recency (Days Since Last Order)",
                            position: "insideBottom",
                            offset: -10,
                            fontSize: 11,
                            fill: "#64748b"
                          }}
                        />
                        <YAxis
                          type="number"
                          dataKey="monetary"
                          name="Monetary"
                          unit="$"
                          label={{
                            value: "Monetary Spend ($)",
                            angle: -90,
                            position: "insideLeft",
                            fontSize: 11,
                            fill: "#64748b"
                          }}
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

              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2 border-b pb-2">
                    <PieIcon className="w-5 h-5 text-[#2874f0]" />
                    <h3 className="font-extrabold text-slate-800 text-sm">Customer Share by Segment</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-4">
                    Breakdown of behavioral clusters across active audience
                  </p>
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
                        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
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
                    <div>
                      Avg Spend: <span className="font-bold text-slate-800">${c.avg_monetary}</span>
                    </div>
                    <div>
                      Avg Recency: <span className="font-bold text-slate-800">{c.avg_recency} days</span>
                    </div>
                    <div>
                      Frequency: <span className="font-bold text-slate-800">{c.avg_frequency} orders</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Live Customer Orders (MySQL / XAMPP)</h2>
                  <p className="text-xs text-slate-500">
                    Relational records stored in `orders` and `order_items` (Port 3307)
                  </p>
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
                              {ord.items &&
                                ord.items.map((it, idx) => (
                                  <div key={idx} className="text-slate-800">
                                    • <span className="font-semibold">{it.product_title}</span>{" "}
                                    <span className="font-bold text-slate-500">(x{it.quantity})</span> - $
                                    {parseFloat(it.unit_price).toFixed(2)}
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
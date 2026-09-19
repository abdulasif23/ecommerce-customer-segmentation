import React, { useState, useEffect } from "react";
import { ShoppingCart, LayoutDashboard, Store, Tag, RefreshCw } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000/api";

const DEFAULT_PRODUCTS = [
  { id: 1, title: "Wireless Noise-Canceling Headphones", price: 149.99, category: "Electronics" },
  { id: 2, title: "Smart Fitness Watch", price: 99.50, category: "Wearables" },
  { id: 3, title: "Ergonomic Mechanical Keyboard", price: 89.00, category: "Accessories" },
  { id: 4, title: "Ultra-Wide Gaming Monitor", price: 349.99, category: "Electronics" },
  { id: 5, title: "Running Shoes", price: 65.00, category: "Apparel" },
  { id: 6, title: "Stainless Steel Water Bottle", price: 25.00, category: "Lifestyle" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("store");
  const [customerId, setCustomerId] = useState(1);
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [cart, setCart] = useState({});
  const [segmentData, setSegmentData] = useState({
    segment_name: "Prospect / Guest",
    marketing_action: "Explore our collection and unlock personalized segment discounts!",
    discount_code: "WELCOME10",
    frequency: 0,
    monetary: 0.0,
  });
  const [adminClusters, setAdminClusters] = useState({
    total_customers: 0,
    clusters: [
      { cluster_id: 0, segment_name: "VIP / Champions", customer_count: 0, avg_recency: 12, avg_frequency: 14, avg_monetary: 420.0, recommended_action: "Offer VIP loyalty access" },
      { cluster_id: 1, segment_name: "At-Risk / Dormant", customer_count: 0, avg_recency: 95, avg_frequency: 2, avg_monetary: 65.0, recommended_action: "Send win-back discounts" },
      { cluster_id: 2, segment_name: "New / Exploring Customers", customer_count: 0, avg_recency: 5, avg_frequency: 1, avg_monetary: 45.0, recommended_action: "Deliver onboarding coupon" },
      { cluster_id: 3, segment_name: "Loyal Regulars", customer_count: 0, avg_recency: 25, avg_frequency: 6, avg_monetary: 180.0, recommended_action: "Cross-sell related products" },
    ],
  });
  const [notification, setNotification] = useState("");

  useEffect(() => {
    fetchProducts();
    fetchUserSegment();
  }, [customerId]);

  useEffect(() => {
    if (activeTab === "admin") {
      fetchAdminData();
    }
  }, [activeTab]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/products`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) setProducts(data);
      }
    } catch (err) {
      console.warn("Using fallback catalog. Backend not reachable:", err);
    }
  };

  const fetchUserSegment = async () => {
    try {
      const res = await fetch(`${API_BASE}/users/${customerId}/segment`);
      if (res.ok) {
        const data = await res.json();
        setSegmentData(data);
      }
    } catch (err) {
      console.warn("Backend segment endpoint not reachable:", err);
    }
  };

  const fetchAdminData = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/clusters`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.clusters && data.clusters.length > 0) {
          setAdminClusters(data);
        }
      }
    } catch (err) {
      console.warn("Backend cluster stats not reachable:", err);
    }
  };

  const addToCart = (product) => {
    setCart((prev) => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1,
    }));
  };

  const handleCheckout = async () => {
    const items = Object.entries(cart).map(([productId, quantity]) => ({
      product_id: parseInt(productId),
      quantity,
    }));

    if (items.length === 0) return;

    try {
      const res = await fetch(`${API_BASE}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: customerId, items }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotification(`Order placed successfully! Total: $${data.total_amount}`);
        setCart({});
        fetchUserSegment();
        setTimeout(() => setNotification(""), 4000);
      }
    } catch (err) {
      alert("Checkout succeeded locally! Start the backend server to record to the DB.");
      setCart({});
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="font-black text-2xl tracking-tight text-indigo-600">ApexStore</span>
          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">ML Driven</span>
        </div>

        {/* View Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("store")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium text-sm transition ${
              activeTab === "store" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Storefront</span>
          </button>
          <button
            onClick={() => setActiveTab("admin")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium text-sm transition ${
              activeTab === "admin" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Admin Dashboard</span>
          </button>
        </div>

        {/* Customer Profile Picker */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Customer ID:</label>
          <input
            type="number"
            min="1"
            max="100"
            value={customerId}
            onChange={(e) => setCustomerId(parseInt(e.target.value) || 1)}
            className="w-16 border border-slate-300 rounded px-2 py-1 text-sm bg-white font-medium"
          />
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-6">
        {notification && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm font-medium">
            {notification}
          </div>
        )}

        {activeTab === "store" ? (
          <div>
            {/* Dynamic Customer Cluster Banner */}
            <div className="mb-8 p-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded font-semibold">
                    Segment: {segmentData.segment_name}
                  </span>
                </div>
                <h2 className="text-xl font-bold">{segmentData.marketing_action}</h2>
                <p className="text-xs text-white/80 mt-1">
                  Total Purchases: {segmentData.frequency} orders | Lifetime Spend: ${Number(segmentData.monetary).toFixed(2)}
                </p>
              </div>
              {segmentData.discount_code && (
                <div className="bg-white/10 border border-white/30 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center space-x-3">
                  <Tag className="w-5 h-5 text-indigo-200" />
                  <div>
                    <div className="text-[10px] uppercase text-white/70">Personal Discount</div>
                    <div className="font-mono font-bold tracking-wider">{segmentData.discount_code}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Product Catalog */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {products.map((p) => (
                <div key={p.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-semibold">{p.category}</span>
                    <h3 className="font-semibold text-lg text-slate-900 mt-1">{p.title}</h3>
                    <p className="text-xl font-bold text-indigo-600 mt-2">${Number(p.price).toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => addToCart(p)}
                    className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>

            {/* Floating Cart Drawer */}
            {Object.keys(cart).length > 0 && (
              <div className="fixed bottom-6 right-6 bg-white border border-slate-200 rounded-2xl shadow-xl p-5 w-80">
                <div className="flex items-center space-x-2 font-bold text-slate-800 mb-3">
                  <ShoppingCart className="w-5 h-5 text-indigo-600" />
                  <span>Cart</span>
                </div>
                <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                  {Object.entries(cart).map(([pId, qty]) => {
                    const prod = products.find((p) => p.id === parseInt(pId));
                    return (
                      <div key={pId} className="flex justify-between text-xs text-slate-600">
                        <span>{prod?.title} (x{qty})</span>
                        <span className="font-semibold">${((prod?.price || 0) * qty).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg text-sm transition"
                >
                  Place Order
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Admin Analytics View */
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">RFM Customer Segments</h1>
                <p className="text-sm text-slate-500">Live K-Means cluster classification based on customer transactional data</p>
              </div>
              <button
                onClick={fetchAdminData}
                className="flex items-center space-x-1 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Segments</span>
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {adminClusters.clusters.map((c) => (
                <div key={c.cluster_id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold uppercase text-indigo-600">{c.segment_name}</span>
                  <div className="text-2xl font-bold text-slate-900 mt-2">{c.customer_count} Users</div>
                  <div className="text-xs text-slate-500 mt-1">Avg Spend: ${c.avg_monetary}</div>
                </div>
              ))}
            </div>

            {/* Playbook Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-xs">
                  <tr>
                    <th className="p-4">Segment Name</th>
                    <th className="p-4">Customer Count</th>
                    <th className="p-4">Avg Recency</th>
                    <th className="p-4">Avg Frequency</th>
                    <th className="p-4">Avg Monetary</th>
                    <th className="p-4">Automated Playbook Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminClusters.clusters.map((c) => (
                    <tr key={c.cluster_id} className="hover:bg-slate-50">
                      <td className="p-4 font-semibold text-slate-900">{c.segment_name}</td>
                      <td className="p-4">{c.customer_count}</td>
                      <td className="p-4 text-slate-500">{c.avg_recency} days</td>
                      <td className="p-4 text-slate-500">{c.avg_frequency} orders</td>
                      <td className="p-4 font-medium text-indigo-600">${c.avg_monetary}</td>
                      <td className="p-4 text-slate-600">{c.recommended_action}</td>
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
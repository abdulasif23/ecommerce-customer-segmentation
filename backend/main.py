import os
from datetime import datetime
from typing import List
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pymysql
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

app = FastAPI(title="E-Commerce Real-Time MySQL Segmentation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_DIR = "ml_pipeline"
MODEL_PATH = os.path.join(MODEL_DIR, "customer_segmentation_model.joblib")
os.makedirs(MODEL_DIR, exist_ok=True)

def get_db():
    return pymysql.connect(
        host="localhost",
        port=3307,
        user="root",
        password="",
        database="ecommerce_db",
        autocommit=True,
        cursorclass=pymysql.cursors.DictCursor
    )

def init_db():
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS orders (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    customer_id INT NOT NULL,
                    customer_name VARCHAR(100) NOT NULL,
                    total_items INT NOT NULL,
                    subtotal DECIMAL(10,2) NOT NULL,
                    discount_pct DECIMAL(5,2) NOT NULL,
                    discount_amount DECIMAL(10,2) NOT NULL,
                    final_paid DECIMAL(10,2) NOT NULL,
                    order_date DATETIME NOT NULL
                )
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS order_items (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    order_id INT NOT NULL,
                    product_id INT NOT NULL,
                    product_title VARCHAR(255) NOT NULL,
                    category VARCHAR(100) NOT NULL,
                    unit_price DECIMAL(10,2) NOT NULL,
                    quantity INT NOT NULL,
                    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
                )
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS products (
                    id INT PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    price DECIMAL(10,2) NOT NULL,
                    original_price DECIMAL(10,2) NOT NULL,
                    rating DECIMAL(2,1) NOT NULL,
                    reviews INT NOT NULL,
                    category VARCHAR(100) NOT NULL,
                    image_url VARCHAR(500) NOT NULL,
                    cross_sell_category VARCHAR(100) NOT NULL,
                    tag VARCHAR(50) NOT NULL
                )
            """)

            catalog = [
                (1, "Nike Air Zoom Pegasus 40 Running Shoes", 119.99, 159.99, 4.8, 1420, "Footwear", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80", "Sports & Fitness", "Trending"),
                (2, "Puma Men Retro Low-Top Sneakers", 64.50, 89.00, 4.5, 870, "Footwear", "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&q=80", "Sports & Fitness", "Hot Deal"),
                (3, "Adidas Ultraboost Light Running Shoes", 139.00, 180.00, 4.9, 2310, "Footwear", "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600&q=80", "Sports & Fitness", "Bestseller"),
                (4, "Jordan Retro High OG Basketball Shoes", 179.99, 219.99, 4.9, 3100, "Footwear", "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=600&q=80", "Sports & Fitness", "Limited"),
                (5, "Apple iPhone 15 Pro (128GB) - Blue", 899.00, 999.00, 4.9, 5820, "Mobiles", "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80", "Electronics Accessories", "Flagship"),
                (6, "Samsung Galaxy S24 Ultra 5G (256GB)", 1149.00, 1299.00, 4.8, 3100, "Mobiles", "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80", "Electronics Accessories", "Top Rated"),
                (7, "OnePlus 12 5G (Flowy Emerald)", 799.00, 899.00, 4.7, 1840, "Mobiles", "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&q=80", "Electronics Accessories", "Super Fast"),
                (8, "Apple MacBook Air 13-inch M2", 999.00, 1099.00, 4.9, 4200, "Laptops", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80", "Electronics Accessories", "Editor Choice"),
                (9, "Dell XPS 15 OLED InfinityEdge Laptop", 1399.00, 1599.00, 4.7, 1230, "Laptops", "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&q=80", "Electronics Accessories", "Performance"),
                (10, "Sony WH-1000XM5 Noise-Canceling Headphones", 348.00, 399.00, 4.9, 3890, "Audio", "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80", "Electronics Accessories", "ANC Audio"),
                (11, "Apple Watch Series 9 GPS 45mm", 389.00, 429.00, 4.8, 1950, "Audio", "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80", "Sports & Fitness", "Smart Health"),
                (12, "Anti-Blister Running Socks (Pack of 3)", 14.99, 24.99, 4.7, 940, "Sports & Fitness", "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=600&q=80", "Footwear", "Add-on"),
                (13, "Motivational Gym Water Bottle (1L)", 19.99, 29.99, 4.6, 1100, "Sports & Fitness", "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80", "Footwear", "Essential"),
                (14, "Magnetic Fast Wireless Power Bank (10,000mAh)", 39.99, 59.99, 4.8, 2150, "Electronics Accessories", "https://images.unsplash.com/photo-1609592807963-380d3810143a?w=600&q=80", "Mobiles", "Fast Charge"),
                (15, "Drop-Proof Slim Matte Protection Case", 16.50, 25.00, 4.7, 3200, "Electronics Accessories", "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&q=80", "Mobiles", "Protection")
            ]

            cursor.executemany("""
                INSERT INTO products (id, title, price, original_price, rating, reviews, category, image_url, cross_sell_category, tag)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE 
                    title=VALUES(title), price=VALUES(price), original_price=VALUES(original_price), 
                    category=VALUES(category), image_url=VALUES(image_url), cross_sell_category=VALUES(cross_sell_category)
            """, catalog)

        conn.close()
    except Exception as e:
        print(f"Database initialization warning: {e}")

init_db()

class OrderItemPayload(BaseModel):
    product_id: int
    quantity: int

class CheckoutRequest(BaseModel):
    customer_id: int
    customer_name: str
    items: List[OrderItemPayload]
    discount_pct: float

@app.get("/api/products")
def get_products():
    conn = get_db()
    with conn.cursor() as cursor:
        cursor.execute("SELECT * FROM products")
        products = cursor.fetchall()
    conn.close()
    return products

@app.post("/api/checkout")
def place_order(order: CheckoutRequest):
    conn = get_db()
    with conn.cursor() as cursor:
        subtotal = 0.0
        total_items = 0
        items_to_save = []

        for item in order.items:
            cursor.execute("SELECT title, price, category FROM products WHERE id = %s", (item.product_id,))
            p = cursor.fetchone()
            if not p:
                conn.close()
                raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")

            line_cost = float(p["price"]) * item.quantity
            subtotal += line_cost
            total_items += item.quantity
            items_to_save.append({
                "product_id": item.product_id,
                "title": p["title"],
                "category": p["category"],
                "unit_price": float(p["price"]),
                "quantity": item.quantity
            })

        discount_amount = round(subtotal * (order.discount_pct / 100.0), 2)
        final_paid = round(max(subtotal - discount_amount, 0.0), 2)
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        cursor.execute("""
            INSERT INTO orders (customer_id, customer_name, total_items, subtotal, discount_pct, discount_amount, final_paid, order_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (order.customer_id, order.customer_name, total_items, subtotal, order.discount_pct, discount_amount, final_paid, now_str))

        order_id = cursor.lastrowid

        for it in items_to_save:
            cursor.execute("""
                INSERT INTO order_items (order_id, product_id, product_title, category, unit_price, quantity)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (order_id, it["product_id"], it["title"], it["category"], it["unit_price"], it["quantity"]))

    conn.close()
    return {
        "status": "success",
        "order_id": order_id,
        "customer_id": order.customer_id,
        "customer_name": order.customer_name,
        "total_items": total_items,
        "subtotal": round(subtotal, 2),
        "discount_pct": order.discount_pct,
        "discount_amount": discount_amount,
        "final_paid": final_paid,
        "order_date": now_str
    }

@app.get("/api/admin/orders")
def get_all_orders():
    conn = get_db()
    with conn.cursor() as cursor:
        cursor.execute("SELECT * FROM orders ORDER BY id DESC")
        orders = cursor.fetchall()
        for ord_entry in orders:
            cursor.execute("SELECT * FROM order_items WHERE order_id = %s", (ord_entry["id"],))
            ord_entry["items"] = cursor.fetchall()
    conn.close()
    return orders

@app.get("/api/users/{customer_id}/segment")
def get_user_segment(customer_id: int):
    conn = get_db()
    with conn.cursor() as cursor:
        cursor.execute("SELECT order_date, final_paid FROM orders WHERE customer_id = %s", (customer_id,))
        rows = cursor.fetchall()
    conn.close()

    if not rows:
        return {
            "customer_id": customer_id,
            "segment_name": "New Guest",
            "recency_days": 0,
            "frequency": 0,
            "monetary": 0.0,
            "loyalty_discount_pct": 5,
            "marketing_action": "Welcome offer! Get flat 5% off on your first order.",
            "discount_code": "WELCOME5",
            "is_inactive": False
        }

    df_user = pd.DataFrame(rows)
    df_user['order_date'] = pd.to_datetime(df_user['order_date'])
    snapshot = datetime.now()
    recency = (snapshot - df_user['order_date'].max()).days
    frequency = len(df_user)
    monetary = float(df_user['final_paid'].sum())

    if frequency >= 5:
        loyalty_discount_pct = 20
        discount_code = "VIPCONTINUOUS20"
        loyalty_msg = "VIP Continuous Buyer: You've unlocked our highest 20% loyalty tier!"
        segment_name = "VIP / Continuous Buyer"
        is_inactive = False
    elif recency > 30:
        loyalty_discount_pct = 25
        discount_code = "COMEBACK25"
        loyalty_msg = "We Miss You! Take 25% off to welcome you back!"
        segment_name = "At-Risk / Low Interaction"
        is_inactive = True
    elif frequency >= 2:
        loyalty_discount_pct = 12
        discount_code = "LOYAL12"
        loyalty_msg = "Frequent Shopper: 12% loyalty discount automatically applied."
        segment_name = "Loyal Regular"
        is_inactive = False
    else:
        loyalty_discount_pct = 5
        discount_code = "WELCOME5"
        loyalty_msg = "Regular Shopper: 5% discount applied."
        segment_name = "Regular Shopper"
        is_inactive = False

    return {
        "customer_id": customer_id,
        "segment_name": segment_name,
        "recency_days": recency,
        "frequency": frequency,
        "monetary": round(monetary, 2),
        "loyalty_discount_pct": loyalty_discount_pct,
        "marketing_action": loyalty_msg,
        "discount_code": discount_code,
        "is_inactive": is_inactive
    }

# --- ROBUST RFM & K-MEANS RETRIEVAL ---
@app.get("/api/admin/clusters")
def get_admin_clusters():
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("SELECT customer_id, customer_name, order_date, final_paid FROM orders")
            rows = cursor.fetchall()
        conn.close()

        if not rows:
            return {"total_customers": 0, "clusters": [], "scatter_data": []}

        df = pd.DataFrame(rows)
        df['order_date'] = pd.to_datetime(df['order_date'])
        snapshot = datetime.now()

        # Group by customer
        rfm_list = []
        for (cid, cname), group in df.groupby(['customer_id', 'customer_name']):
            r = max(int((snapshot - group['order_date'].max()).days), 0)
            f = int(len(group))
            m = round(float(group['final_paid'].sum()), 2)
            rfm_list.append({
                "customer_id": int(cid),
                "customer_name": str(cname),
                "Recency": r,
                "Frequency": f,
                "Monetary": m
            })

        rfm = pd.DataFrame(rfm_list)

        # Fit or predict clusters
        cluster_names = {
            0: "VIP Frequent Buyers",
            1: "At-Risk / Inactive",
            2: "New Shoppers",
            3: "Loyal Regulars"
        }

        k = min(4, len(rfm))
        if k >= 2:
            scaler = StandardScaler()
            features = np.log1p(rfm[['Recency', 'Frequency', 'Monetary']])
            scaled = scaler.fit_transform(features)
            km = KMeans(n_clusters=k, random_state=42, n_init=10)
            rfm['Cluster'] = km.fit_predict(scaled)
        else:
            rfm['Cluster'] = 0

        summary = []
        for c_id, group in rfm.groupby('Cluster'):
            summary.append({
                "cluster_id": int(c_id),
                "segment_name": cluster_names.get(int(c_id), f"Cluster #{c_id}"),
                "customer_count": int(len(group)),
                "avg_recency": round(float(group['Recency'].mean()), 1),
                "avg_frequency": round(float(group['Frequency'].mean()), 1),
                "avg_monetary": round(float(group['Monetary'].mean()), 2),
                "recommended_action": "Automated behavioral discount"
            })

        scatter_data = []
        for _, row in rfm.iterrows():
            cid_val = int(row['Cluster'])
            scatter_data.append({
                "customer_id": int(row['customer_id']),
                "customer_name": row['customer_name'],
                "recency": int(row['Recency']),
                "monetary": float(row['Monetary']),
                "frequency": int(row['Frequency']),
                "cluster_id": cid_val,
                "segment_name": cluster_names.get(cid_val, f"Cluster #{cid_val}")
            })

        return {
            "total_customers": int(len(rfm)),
            "clusters": summary,
            "scatter_data": scatter_data
        }
    except Exception as e:
        print(f"Error in get_admin_clusters: {e}")
        return {"total_customers": 0, "clusters": [], "scatter_data": [], "error": str(e)}

@app.post("/api/admin/retrain")
def retrain_kmeans():
    conn = get_db()
    with conn.cursor() as cursor:
        cursor.execute("SELECT customer_id, customer_name, order_date, final_paid FROM orders")
        rows = cursor.fetchall()
    conn.close()

    if len(rows) < 2:
        raise HTTPException(
            status_code=400, 
            detail="Need at least 2 customer purchase records in MySQL to compute clusters."
        )

    df = pd.DataFrame(rows)
    df['order_date'] = pd.to_datetime(df['order_date'])
    snapshot = datetime.now()

    rfm = df.groupby('customer_id').agg(
        Recency=('order_date', lambda x: max((snapshot - x.max()).days, 0)),
        Frequency=('order_date', 'count'),
        Monetary=('final_paid', 'sum')
    ).reset_index()

    k = min(4, len(rfm))
    scaler = StandardScaler()
    rfm_log = np.log1p(rfm[['Recency', 'Frequency', 'Monetary']])
    rfm_scaled = scaler.fit_transform(rfm_log)

    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    kmeans.fit(rfm_scaled)

    artifacts = {
        'model': kmeans,
        'scaler': scaler,
        'trained_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        'customer_count': len(rfm),
        'n_clusters': k
    }

    joblib.dump(artifacts, MODEL_PATH)

    return {
        "status": "success",
        "message": f"K-Means model successfully retrained on {len(rfm)} customers in MySQL.",
        "n_clusters": k,
        "inertia": round(float(kmeans.inertia_), 2),
        "trained_at": artifacts['trained_at']
    }
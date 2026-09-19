import os
from datetime import datetime
from typing import List, Optional
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3

app = FastAPI(title="E-Commerce Customer Segmentation API")

# Enable CORS for React frontend (Vite runs on port 5173 by default)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "ecommerce.db"
MODEL_PATH = os.path.join("ml_pipeline", "customer_segmentation_model.joblib")

# --- DATABASE SETUP ---
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            total_amount REAL NOT NULL,
            order_date TEXT NOT NULL
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            price REAL NOT NULL,
            category TEXT NOT NULL
        )
    """)
    # Seed initial products if empty
    cursor.execute("SELECT COUNT(*) FROM products")
    if cursor.fetchone()[0] == 0:
        sample_products = [
            ("Wireless Noise-Canceling Headphones", 149.99, "Electronics"),
            ("Smart Fitness Watch", 99.50, "Wearables"),
            ("Ergonomic Mechanical Keyboard", 89.00, "Accessories"),
            ("Ultra-Wide Gaming Monitor", 349.99, "Electronics"),
            ("Running Shoes", 65.00, "Apparel"),
            ("Stainless Steel Water Bottle", 25.00, "Lifestyle"),
        ]
        cursor.executemany(
            "INSERT INTO products (title, price, category) VALUES (?, ?, ?)",
            sample_products
        )
    conn.commit()
    conn.close()

init_db()

# --- MODEL LOADER ---
artifacts = None
if os.path.exists(MODEL_PATH):
    artifacts = joblib.load(MODEL_PATH)
else:
    print(f"Warning: Model not found at {MODEL_PATH}. Run train_kmeans.py first.")

# --- SCHEMAS ---
class OrderItem(BaseModel):
    product_id: int
    quantity: int

class CheckoutRequest(BaseModel):
    customer_id: int
    items: List[OrderItem]

# --- MARKETING PLAYBOOK MAPPING ---
PLAYBOOK = {
    0: {
        "segment_name": "VIP / Champions",
        "description": "High spending, highly frequent, and recent shoppers.",
        "marketing_action": "Offer early access to new collections and complimentary priority shipping.",
        "discount_code": "VIPEXCLUSIVE"
    },
    1: {
        "segment_name": "At-Risk / Dormant",
        "description": "Used to spend consistently, but have not returned in a long time.",
        "marketing_action": "Send a 'We Miss You' win-back email with a special discount code.",
        "discount_code": "COMEBACK20"
    },
    2: {
        "segment_name": "New / Exploring Customers",
        "description": "Recent shoppers with few purchases and moderate-to-low cart values.",
        "marketing_action": "Deliver an onboarding product guide and a second-purchase reward.",
        "discount_code": "WELCOME10"
    },
    3: {
        "segment_name": "Loyal Regulars",
        "description": "Steady purchase frequency with moderate order values.",
        "marketing_action": "Offer cross-sell product recommendations and loyalty points.",
        "discount_code": "LOYALTY15"
    }
}

# --- ROUTES ---

@app.get("/api/products")
def get_products():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, price, category FROM products")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "title": r[1], "price": r[2], "category": r[3]} for r in rows]

@app.post("/api/checkout")
def checkout(order: CheckoutRequest):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    total_amount = 0.0
    for item in order.items:
        cursor.execute("SELECT price FROM products WHERE id = ?", (item.product_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        total_amount += row[0] * item.quantity

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute(
        "INSERT INTO orders (customer_id, total_amount, order_date) VALUES (?, ?, ?)",
        (order.customer_id, total_amount, now_str)
    )
    conn.commit()
    conn.close()

    return {"status": "success", "total_amount": round(total_amount, 2), "order_date": now_str}

@app.get("/api/users/{customer_id}/segment")
def get_user_segment(customer_id: int):
    if artifacts is None:
        raise HTTPException(status_code=500, detail="ML model artifacts not loaded")

    conn = sqlite3.connect(DB_PATH)
    df_user = pd.read_sql_query(
        "SELECT order_date, total_amount FROM orders WHERE customer_id = ?",
        conn,
        params=(customer_id,)
    )
    conn.close()

    if df_user.empty:
        # User has no purchase history yet
        return {
            "customer_id": customer_id,
            "segment_name": "Prospect / Guest",
            "recency_days": None,
            "frequency": 0,
            "monetary": 0.0,
            "marketing_action": "Display welcome bonus banner for first-time orders.",
            "discount_code": "FIRSTORDER"
        }

    df_user['order_date'] = pd.to_datetime(df_user['order_date'])
    snapshot = datetime.now()
    recency = (snapshot - df_user['order_date'].max()).days
    frequency = len(df_user)
    monetary = float(df_user['total_amount'].sum())

    # Transform features using trained scaler and model
    rfm_vector = np.log1p([[max(recency, 0), frequency, monetary]])
    rfm_scaled = artifacts['scaler'].transform(rfm_vector)
    cluster_id = int(artifacts['model'].predict(rfm_scaled)[0])

    playbook_info = PLAYBOOK.get(cluster_id, PLAYBOOK[0])

    return {
        "customer_id": customer_id,
        "cluster_id": cluster_id,
        "recency_days": recency,
        "frequency": frequency,
        "monetary": round(monetary, 2),
        **playbook_info
    }

@app.get("/api/admin/clusters")
def get_admin_clusters():
    """Aggregates all customer segments for dashboard reporting."""
    if artifacts is None:
        raise HTTPException(status_code=500, detail="ML model not loaded")

    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql_query("SELECT customer_id, order_date, total_amount FROM orders", conn)
    conn.close()

    if df.empty:
        return {"total_customers": 0, "clusters": []}

    df['order_date'] = pd.to_datetime(df['order_date'])
    snapshot = datetime.now()

    rfm = df.groupby('customer_id').agg({
        'order_date': lambda x: (snapshot - x.max()).days,
        'total_amount': ['count', 'sum']
    })
    rfm.columns = ['Recency', 'Frequency', 'Monetary']

    rfm_log = np.log1p(rfm[['Recency', 'Frequency', 'Monetary']])
    rfm_scaled = artifacts['scaler'].transform(rfm_log)
    rfm['Cluster'] = artifacts['model'].predict(rfm_scaled)

    summary = []
    for c_id, group in rfm.groupby('Cluster'):
        info = PLAYBOOK.get(int(c_id), {})
        summary.append({
            "cluster_id": int(c_id),
            "segment_name": info.get("segment_name", f"Segment {c_id}"),
            "customer_count": len(group),
            "avg_recency": round(group['Recency'].mean(), 1),
            "avg_frequency": round(group['Frequency'].mean(), 1),
            "avg_monetary": round(group['Monetary'].mean(), 2),
            "recommended_action": info.get("marketing_action", "")
        })

    return {"total_customers": len(rfm), "clusters": summary}
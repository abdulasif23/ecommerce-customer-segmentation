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
            # 1. Strict 1-to-1 Customer Registry Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS customers (
                    id INT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    created_at DATETIME NOT NULL
                )
            """)

            # 2. Orders Table
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

            # 3. Order Items Table
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

            # 4. Products Catalog Table
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

            # Backfill existing customers from past orders so existing IDs stay locked to their original owner
            cursor.execute("""
                INSERT IGNORE INTO customers (id, name, created_at)
                SELECT customer_id, MIN(customer_name), MIN(order_date)
                FROM orders
                GROUP BY customer_id
            """)

            # 56 Curated Products across 8 Categories with Smart Cross-Sell Mapping
            catalog = [
                # --- MOBILES (1 - 10) -> Cross-sells: Mobile Accessories ---
                (1, "Apple iPhone 15 Pro (128GB) - Blue Titanium", 899.00, 999.00, 4.9, 5820, "Mobiles", "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80", "Mobile Accessories", "Flagship"),
                (2, "Samsung Galaxy S24 Ultra 5G (256GB)", 1149.00, 1299.00, 4.8, 3100, "Mobiles", "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80", "Mobile Accessories", "Top Rated"),
                (3, "OnePlus 12 5G (Flowy Emerald, 16GB RAM)", 799.00, 899.00, 4.7, 1840, "Mobiles", "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&q=80", "Mobile Accessories", "Super Fast"),
                (4, "Google Pixel 8 Pro (Obsidian, 128GB)", 849.00, 999.00, 4.8, 2410, "Mobiles", "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80", "Mobile Accessories", "AI Camera"),
                (5, "Xiaomi 14 Ultra Leica Edition (512GB)", 949.00, 1099.00, 4.7, 1120, "Mobiles", "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80", "Mobile Accessories", "Pro Optics"),
                (6, "Nothing Phone (2) 5G (Dark Grey, 256GB)", 499.00, 599.00, 4.6, 3290, "Mobiles", "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600&q=80", "Mobile Accessories", "Glyph UI"),
                (7, "Apple iPhone 15 (128GB) - Midnight Black", 729.00, 799.00, 4.8, 6420, "Mobiles", "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&q=80", "Mobile Accessories", "Bestseller"),
                (8, "Samsung Galaxy Z Flip 5 5G (Mint, 256GB)", 899.00, 999.00, 4.6, 1590, "Mobiles", "https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=600&q=80", "Mobile Accessories", "Foldable"),
                (9, "Realme GT 6T 5G (Fluid Silver, 12GB RAM)", 379.00, 449.00, 4.5, 2180, "Mobiles", "https://images.unsplash.com/photo-1533228100845-08145b01de14?w=600&q=80", "Mobile Accessories", "Value Pick"),
                (10, "Motorola Edge 50 Pro 5G (Luxe Lavender)", 419.00, 499.00, 4.6, 1430, "Mobiles", "https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=600&q=80", "Mobile Accessories", "Curved OLED"),

                # --- MOBILE ACCESSORIES (11 - 18) -> Cross-sells: Mobiles ---
                (11, "Magnetic Fast Wireless Power Bank (10,000mAh)", 39.99, 59.99, 4.8, 2150, "Mobile Accessories", "https://images.unsplash.com/photo-1609592807963-380d3810143a?w=600&q=80", "Mobiles", "MagSafe"),
                (12, "Drop-Proof Slim Matte Shockproof Case", 16.50, 25.00, 4.7, 3200, "Mobile Accessories", "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&q=80", "Mobiles", "Protection"),
                (13, "65W GaN III Dual USB-C Fast Wall Charger", 29.99, 44.99, 4.9, 4120, "Mobile Accessories", "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&q=80", "Mobiles", "Fast Charge"),
                (14, "9H Tempered Glass Privacy Screen Protector (2-Pack)", 12.99, 19.99, 4.6, 5400, "Mobile Accessories", "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&q=80", "Mobiles", "Essential"),
                (15, "Braided Nylon USB-C to USB-C 100W Cable (2m)", 14.50, 22.00, 4.8, 3890, "Mobile Accessories", "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&q=80", "Mobiles", "Durable"),
                (16, "Magnetic Car Vent Wireless Charging Mount", 27.99, 39.99, 4.7, 1760, "Mobile Accessories", "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=600&q=80", "Mobiles", "Car Gear"),
                (17, "Aluminum Foldable Desk Phone & Tablet Stand", 18.99, 29.99, 4.8, 2940, "Mobile Accessories", "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600&q=80", "Mobiles", "Desk Setup"),
                (18, "Sapphire Camera Lens Protector Ring Set", 11.99, 18.99, 4.5, 1620, "Mobile Accessories", "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&q=80", "Mobiles", "Camera Guard"),

                # --- LAPTOPS (19 - 26) -> Cross-sells: Laptop Accessories ---
                (19, "Apple MacBook Air 13-inch M2 (8GB/256GB)", 999.00, 1099.00, 4.9, 4200, "Laptops", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80", "Laptop Accessories", "Editor Choice"),
                (20, "Dell XPS 15 OLED InfinityEdge Laptop", 1399.00, 1599.00, 4.7, 1230, "Laptops", "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&q=80", "Laptop Accessories", "Performance"),
                (21, "ASUS ROG Zephyrus G14 RTX 4060 Gaming Laptop", 1299.00, 1499.00, 4.8, 1980, "Laptops", "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80", "Laptop Accessories", "Gaming Pro"),
                (22, "Lenovo ThinkPad X1 Carbon Gen 11 Business", 1249.00, 1449.00, 4.8, 1450, "Laptops", "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&q=80", "Laptop Accessories", "Enterprise"),
                (23, "HP Spectre x360 14 2-in-1 Convertible Touch", 1149.00, 1349.00, 4.7, 1120, "Laptops", "https://images.unsplash.com/photo-1544731612-de7f96afe55f?w=600&q=80", "Laptop Accessories", "2-in-1"),
                (24, "Apple MacBook Pro 14-inch M3 Pro (18GB/512GB)", 1799.00, 1999.00, 4.9, 2870, "Laptops", "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&q=80", "Laptop Accessories", "Workstation"),
                (25, "Acer Swift Go 14 OLED Intel Core Ultra 7", 799.00, 949.00, 4.6, 980, "Laptops", "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80", "Laptop Accessories", "Thin & Light"),
                (26, "Microsoft Surface Laptop 5 (13.5-inch Touch)", 899.00, 1049.00, 4.6, 1340, "Laptops", "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600&q=80", "Laptop Accessories", "Sleek"),

                # --- LAPTOP ACCESSORIES (27 - 33) -> Cross-sells: Laptops ---
                (27, "7-in-1 USB-C Hub with 4K HDMI & 100W PD", 34.99, 49.99, 4.8, 3650, "Laptop Accessories", "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=600&q=80", "Laptops", "Must Have"),
                (28, "Logitech MX Master 3S Wireless Ergonomic Mouse", 89.99, 99.99, 4.9, 6120, "Laptop Accessories", "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80", "Laptops", "Bestseller"),
                (29, "Water-Resistant Padded 15-inch Laptop Sleeve", 22.99, 34.99, 4.7, 2410, "Laptop Accessories", "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80", "Laptops", "Protection"),
                (30, "Ergonomic Aluminum Ventilated Laptop Riser", 29.99, 44.99, 4.8, 1980, "Laptop Accessories", "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=600&q=80", "Laptops", "Ergonomic"),
                (31, "Keychron K2 Wireless Mechanical Keyboard (RGB)", 79.00, 95.00, 4.8, 2740, "Laptop Accessories", "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80", "Laptops", "Mechanical"),
                (32, "Samsung T7 Shield 1TB Portable NVMe SSD", 99.00, 129.00, 4.9, 4510, "Laptop Accessories", "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&q=80", "Laptops", "Fast Backup"),
                (33, "RGB Dual-Fan Quiet Laptop Cooling Pad", 26.50, 39.99, 4.5, 1690, "Laptop Accessories", "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&q=80", "Laptops", "Cooling"),

                # --- FOOTWEAR (34 - 41) -> Cross-sells: Sports & Fitness ---
                (34, "Nike Air Zoom Pegasus 40 Running Shoes", 119.99, 159.99, 4.8, 1420, "Footwear", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80", "Sports & Fitness", "Trending"),
                (35, "Puma Men Retro Low-Top Sneakers", 64.50, 89.00, 4.5, 870, "Footwear", "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&q=80", "Sports & Fitness", "Hot Deal"),
                (36, "Adidas Ultraboost Light Running Shoes", 139.00, 180.00, 4.9, 2310, "Footwear", "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600&q=80", "Sports & Fitness", "Bestseller"),
                (37, "Jordan Retro High OG Basketball Shoes", 179.99, 219.99, 4.9, 3100, "Footwear", "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=600&q=80", "Sports & Fitness", "Limited"),
                (38, "New Balance 574 Classic Everyday Sneakers", 84.99, 99.99, 4.7, 1920, "Footwear", "https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&q=80", "Sports & Fitness", "Comfort"),
                (39, "ASICS Gel-Kayano 30 Stability Runners", 149.00, 169.00, 4.8, 1580, "Footwear", "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&q=80", "Sports & Fitness", "Marathon"),
                (40, "Converse Chuck Taylor All Star High Top", 59.99, 70.00, 4.7, 4890, "Footwear", "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=600&q=80", "Sports & Fitness", "Iconic"),
                (41, "Under Armour Charged Assert 10 Gym Trainers", 69.99, 85.00, 4.6, 1310, "Footwear", "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80", "Sports & Fitness", "Gym Ready"),

                # --- SPORTS & FITNESS (42 - 47) -> Cross-sells: Footwear ---
                (42, "Anti-Blister Cushioned Running Socks (3 Pairs)", 14.99, 24.99, 4.7, 940, "Sports & Fitness", "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=600&q=80", "Footwear", "Add-on"),
                (43, "Insulated Stainless Gym Water Bottle (1L)", 19.99, 29.99, 4.6, 1100, "Sports & Fitness", "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80", "Footwear", "Essential"),
                (44, "High-Density Non-Slip TPE Yoga & Exercise Mat", 28.50, 39.99, 4.8, 2240, "Sports & Fitness", "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&q=80", "Footwear", "Fitness"),
                (45, "Adjustable Neoprene Dumbbell Pair (5kg x 2)", 34.99, 49.99, 4.7, 1650, "Sports & Fitness", "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&q=80", "Footwear", "Home Gym"),
                (46, "Heavy-Duty Fabric Resistance Bands Set (5 Levels)", 17.99, 26.99, 4.8, 3120, "Sports & Fitness", "https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600&q=80", "Footwear", "Mobility"),
                (47, "Waterproof Sports Duffel Gym Bag with Shoe Pocket", 32.99, 45.00, 4.7, 1480, "Sports & Fitness", "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80", "Footwear", "Gear Bag"),

                # --- AUDIO (48 - 52) -> Cross-sells: Mobile Accessories ---
                (48, "Sony WH-1000XM5 Noise-Canceling Headphones", 348.00, 399.00, 4.9, 3890, "Audio", "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80", "Mobile Accessories", "ANC Audio"),
                (49, "Apple AirPods Pro (2nd Gen) with USB-C Case", 229.00, 249.00, 4.9, 7420, "Audio", "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&q=80", "Mobile Accessories", "Bestseller"),
                (50, "Bose QuietComfort Ultra Wireless Headphones", 379.00, 429.00, 4.8, 1640, "Audio", "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&q=80", "Mobile Accessories", "Spatial Audio"),
                (51, "JBL Flip 6 Portable Waterproof Bluetooth Speaker", 109.00, 129.99, 4.8, 5190, "Audio", "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80", "Mobile Accessories", "Outdoor"),
                (52, "Samsung Galaxy Buds2 Pro Wireless ANC Earbuds", 149.00, 199.00, 4.7, 2890, "Audio", "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80", "Mobile Accessories", "Hi-Fi"),

                # --- SMARTWATCHES (53 - 56) -> Cross-sells: Sports & Fitness ---
                (53, "Apple Watch Series 9 GPS 45mm Midnight", 389.00, 429.00, 4.8, 1950, "Smartwatches", "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80", "Sports & Fitness", "Smart Health"),
                (54, "Samsung Galaxy Watch 6 Classic (47mm, Black)", 329.00, 399.00, 4.7, 1420, "Smartwatches", "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&q=80", "Sports & Fitness", "Rotating Bezel"),
                (55, "Garmin Forerunner 265 GPS Running Smartwatch", 449.00, 499.00, 4.9, 1180, "Smartwatches", "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&q=80", "Sports & Fitness", "Pro Athlete"),
                (56, "Amazfit GTR 4 Smart Fitness Watch (14-Day Battery)", 169.00, 199.00, 4.6, 2310, "Smartwatches", "https://images.unsplash.com/photo-1544117519-31a4b719223d?w=600&q=80", "Sports & Fitness", "Long Battery")
            ]

            cursor.executemany("""
                INSERT INTO products (id, title, price, original_price, rating, reviews, category, image_url, cross_sell_category, tag)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE 
                    title=VALUES(title), price=VALUES(price), original_price=VALUES(original_price), 
                    rating=VALUES(rating), reviews=VALUES(reviews), category=VALUES(category), 
                    image_url=VALUES(image_url), cross_sell_category=VALUES(cross_sell_category), tag=VALUES(tag)
            """, catalog)

        conn.close()
    except Exception as e:
        print(f"Database initialization warning: {e}")


init_db()


class CustomerRegisterRequest(BaseModel):
    customer_id: int
    customer_name: str


class OrderItemPayload(BaseModel):
    product_id: int
    quantity: int


class CheckoutRequest(BaseModel):
    customer_id: int
    customer_name: str
    items: List[OrderItemPayload]
    discount_pct: float


@app.get("/api/customers")
def get_all_customers():
    conn = get_db()
    with conn.cursor() as cursor:
        cursor.execute("SELECT id, name, created_at FROM customers ORDER BY id ASC")
        customers = cursor.fetchall()
    conn.close()
    return customers


@app.get("/api/customers/{customer_id}")
def get_customer_by_id(customer_id: int):
    conn = get_db()
    with conn.cursor() as cursor:
        cursor.execute("SELECT id, name FROM customers WHERE id = %s", (customer_id,))
        cust = cursor.fetchone()
    conn.close()
    if cust:
        return {"registered": True, "customer_id": cust["id"], "customer_name": cust["name"]}
    return {"registered": False, "customer_id": customer_id, "customer_name": ""}


@app.post("/api/customers/register")
def register_customer(payload: CustomerRegisterRequest):
    clean_name = payload.customer_name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Customer name cannot be empty.")

    conn = get_db()
    with conn.cursor() as cursor:
        cursor.execute("SELECT id, name FROM customers WHERE id = %s", (payload.customer_id,))
        existing = cursor.fetchone()
        if existing:
            conn.close()
            if existing["name"].lower() != clean_name.lower():
                raise HTTPException(
                    status_code=409,
                    detail=f"ID #{payload.customer_id} is already permanently assigned to '{existing['name']}'."
                )
            return {"status": "exists", "customer_id": existing["id"], "customer_name": existing["name"]}

        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute(
            "INSERT INTO customers (id, name, created_at) VALUES (%s, %s, %s)",
            (payload.customer_id, clean_name, now_str)
        )
    conn.close()
    return {"status": "registered", "customer_id": payload.customer_id, "customer_name": clean_name}


@app.get("/api/products")
def get_products():
    conn = get_db()
    with conn.cursor() as cursor:
        cursor.execute("SELECT * FROM products ORDER BY id ASC")
        products = cursor.fetchall()
    conn.close()
    return products


@app.post("/api/checkout")
def place_order(order: CheckoutRequest):
    clean_name = order.customer_name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Customer name is required.")

    conn = get_db()
    with conn.cursor() as cursor:
        # Enforce 1-to-1 Customer ID <-> Customer Name binding
        cursor.execute("SELECT id, name FROM customers WHERE id = %s", (order.customer_id,))
        existing_customer = cursor.fetchone()

        if existing_customer:
            if existing_customer["name"].strip().lower() != clean_name.lower():
                conn.close()
                raise HTTPException(
                    status_code=409,
                    detail=f"Customer ID #{order.customer_id} belongs to '{existing_customer['name']}'. One ID can only belong to one customer."
                )
            canonical_name = existing_customer["name"]
        else:
            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute(
                "INSERT INTO customers (id, name, created_at) VALUES (%s, %s, %s)",
                (order.customer_id, clean_name, now_str)
            )
            canonical_name = clean_name

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
        """, (order.customer_id, canonical_name, total_items, subtotal, order.discount_pct, discount_amount, final_paid, now_str))

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
        "customer_name": canonical_name,
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
        cursor.execute("SELECT name FROM customers WHERE id = %s", (customer_id,))
        cust = cursor.fetchone()
        cursor.execute("SELECT order_date, final_paid FROM orders WHERE customer_id = %s", (customer_id,))
        rows = cursor.fetchall()
    conn.close()

    registered_name = cust["name"] if cust else ""

    if not rows:
        return {
            "customer_id": customer_id,
            "registered_name": registered_name,
            "is_registered": bool(cust),
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
    recency = max((snapshot - df_user['order_date'].max()).days, 0)
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
        "registered_name": registered_name,
        "is_registered": bool(cust),
        "segment_name": segment_name,
        "recency_days": recency,
        "frequency": frequency,
        "monetary": round(monetary, 2),
        "loyalty_discount_pct": loyalty_discount_pct,
        "marketing_action": loyalty_msg,
        "discount_code": discount_code,
        "is_inactive": is_inactive
    }


@app.get("/api/admin/clusters")
def get_admin_clusters():
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("SELECT customer_id, customer_name, order_date, final_paid FROM orders")
            rows = cursor.fetchall()
            cursor.execute("SELECT id, name FROM customers")
            cust_rows = cursor.fetchall()
        conn.close()

        if not rows:
            return {"total_customers": 0, "clusters": [], "scatter_data": []}

        cust_map = {int(c["id"]): c["name"] for c in cust_rows}

        df = pd.DataFrame(rows)
        df['order_date'] = pd.to_datetime(df['order_date'])
        snapshot = datetime.now()

        rfm_list = []
        for cid, group in df.groupby('customer_id'):
            cid_int = int(cid)
            cname = cust_map.get(cid_int, str(group['customer_name'].iloc[0]))
            r = max(int((snapshot - group['order_date'].max()).days), 0)
            f = int(len(group))
            m = round(float(group['final_paid'].sum()), 2)
            rfm_list.append({
                "customer_id": cid_int,
                "customer_name": cname,
                "Recency": r,
                "Frequency": f,
                "Monetary": m
            })

        rfm = pd.DataFrame(rfm_list)

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
        "message": f"K-Means model successfully retrained on {len(rfm)} unique customers in MySQL.",
        "n_clusters": k,
        "inertia": round(float(kmeans.inertia_), 2),
        "trained_at": artifacts['trained_at']
    }
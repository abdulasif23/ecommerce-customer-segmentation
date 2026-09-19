import sqlite3
import random
from datetime import datetime, timedelta

DB_PATH = "ecommerce.db"

def seed():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Verify products exist
    cursor.execute("SELECT id, price FROM products")
    products = cursor.fetchall()
    if not products:
        print("No products found. Start the FastAPI backend once to initialize the tables.")
        conn.close()
        return

    print("Generating simulated customer purchase histories...")
    now = datetime.now()
    
    # Generate transactions across Customers 1 to 25
    for customer_id in range(1, 26):
        # Assign behavior profiles to test all 4 clusters
        if customer_id <= 5:       # VIPs (high frequency, high spend, recent)
            num_orders = random.randint(8, 15)
            max_days_ago = 20
        elif customer_id <= 15:    # Regulars (steady, moderate frequency)
            num_orders = random.randint(3, 7)
            max_days_ago = 60
        elif customer_id <= 20:    # Dormant / At-Risk (high recency, inactive)
            num_orders = random.randint(2, 4)
            max_days_ago = 180
        else:                      # New Customers (single recent purchase)
            num_orders = 1
            max_days_ago = 10

        for _ in range(num_orders):
            days_ago = random.randint(1, max_days_ago)
            order_date = (now - timedelta(days=days_ago, hours=random.randint(1, 23))).strftime("%Y-%m-%d %H:%M:%S")
            
            chosen_product = random.choice(products)
            qty = random.randint(1, 3)
            total = round(chosen_product[1] * qty, 2)
            
            cursor.execute(
                "INSERT INTO orders (customer_id, total_amount, order_date) VALUES (?, ?, ?)",
                (customer_id, total, order_date)
            )

    conn.commit()
    conn.close()
    print("Database seeded successfully with historical customer orders!")

if __name__ == "__main__":
    seed()
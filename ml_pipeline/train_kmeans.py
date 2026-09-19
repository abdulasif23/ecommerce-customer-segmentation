import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import joblib
import os

def generate_synthetic_transactions(num_customers=500, max_transactions=20):
    """Generates realistic synthetic e-commerce transaction data."""
    np.random.seed(42)
    data = []
    base_date = datetime(2026, 1, 1)

    for customer_id in range(1, num_customers + 1):
        # Determine customer behavior tendency
        profile = np.random.choice(['vip', 'regular', 'dormant', 'new'], p=[0.15, 0.45, 0.25, 0.15])
        
        if profile == 'vip':
            n_tx = np.random.randint(10, max_transactions + 1)
            spend_range = (100.0, 500.0)
            recency_days_max = 20
        elif profile == 'regular':
            n_tx = np.random.randint(3, 10)
            spend_range = (30.0, 150.0)
            recency_days_max = 60
        elif profile == 'dormant':
            n_tx = np.random.randint(1, 5)
            spend_range = (20.0, 100.0)
            recency_days_max = 180
        else: # new
            n_tx = 1
            spend_range = (15.0, 80.0)
            recency_days_max = 15

        for _ in range(n_tx):
            days_ago = np.random.randint(0, recency_days_max)
            order_date = base_date - timedelta(days=days_ago)
            amount = round(np.random.uniform(*spend_range), 2)
            data.append({
                'customer_id': customer_id,
                'order_date': order_date,
                'total_amount': amount
            })

    return pd.DataFrame(data)

def compute_rfm(df, snapshot_date):
    """Calculates Recency, Frequency, and Monetary metrics per user."""
    rfm = df.groupby('customer_id').agg({
        'order_date': lambda x: (snapshot_date - x.max()).days, # Recency
        'total_amount': ['count', 'sum']                        # Frequency, Monetary
    })
    
    rfm.columns = ['Recency', 'Frequency', 'Monetary']
    return rfm

def train_and_export():
    print("1. Generating transaction data...")
    df = generate_synthetic_transactions()
    
    # Save raw data to csv for record
    os.makedirs('ml_pipeline/data', exist_ok=True)
    df.to_csv('ml_pipeline/data/transactions.csv', index=False)
    print("   Saved raw data to ml_pipeline/data/transactions.csv")

    print("2. Calculating RFM metrics...")
    snapshot = datetime(2026, 1, 2)
    rfm = compute_rfm(df, snapshot)

    print("3. Scaling & transforming features...")
    # Log-transform to handle skewness
    rfm_log = np.log1p(rfm[['Recency', 'Frequency', 'Monetary']])
    
    scaler = StandardScaler()
    rfm_scaled = scaler.fit_transform(rfm_log)

    print("4. Training K-Means model (k=4)...")
    k = 4
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    rfm['Cluster'] = kmeans.fit_predict(rfm_scaled)

    score = silhouette_score(rfm_scaled, rfm['Cluster'])
    print(f"   Model Silhouette Score: {score:.3f}")

    # Inspect cluster centers
    summary = rfm.groupby('Cluster').agg({
        'Recency': 'mean',
        'Frequency': 'mean',
        'Monetary': 'mean'
    }).round(1)
    print("\nCluster Behavioral Averages:\n", summary)

    print("\n5. Exporting model artifacts...")
    artifacts = {
        'scaler': scaler,
        'model': kmeans,
        'snapshot_date': snapshot
    }
    joblib.dump(artifacts, 'ml_pipeline/customer_segmentation_model.joblib')
    print("   Exported to ml_pipeline/customer_segmentation_model.joblib")

if __name__ == '__main__':
    train_and_export()
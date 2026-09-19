import os
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

# Ensure plots directory exists
os.makedirs("ml_pipeline/plots", exist_ok=True)

# 1. Load Seed Data or Synthesized Transactions
df_raw = pd.read_csv("ml_pipeline/data/transactions.csv")
df_raw["order_date"] = pd.to_datetime(df_raw["order_date"])

snapshot = pd.to_datetime("2026-01-02")
rfm = df_raw.groupby("customer_id").agg({
    "order_date": lambda x: (snapshot - x.max()).days,
    "total_amount": ["count", "sum"]
})
rfm.columns = ["Recency", "Frequency", "Monetary"]

# 2. Scaling
rfm_log = np.log1p(rfm)
scaler = StandardScaler()
rfm_scaled = scaler.fit_transform(rfm_log)

# 3. Plot Elbow Method
inertias = []
k_range = range(1, 9)
for k in k_range:
    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    km.fit(rfm_scaled)
    inertias.append(km.inertia_)

plt.figure(figsize=(7, 4))
plt.plot(k_range, inertias, "bo-", linewidth=2)
plt.title("Elbow Method for Optimal k")
plt.xlabel("Number of Clusters (k)")
plt.ylabel("Inertia (Sum of Squared Distances)")
plt.grid(True, linestyle="--", alpha=0.6)
plt.tight_layout()
plt.savefig("ml_pipeline/plots/elbow_curve.png", dpi=300)
plt.close()

# 4. Plot 2D Cluster Separation (Recency vs Monetary)
best_k = 4
kmeans = KMeans(n_clusters=best_k, random_state=42, n_init=10)
rfm["Cluster"] = kmeans.fit_predict(rfm_scaled)

plt.figure(figsize=(8, 5))
scatter = plt.scatter(
    rfm["Recency"],
    rfm["Monetary"],
    c=rfm["Cluster"],
    cmap="viridis",
    alpha=0.7,
    edgecolors="k"
)
plt.colorbar(scatter, label="Assigned Cluster")
plt.title("Customer Segments: Recency vs. Monetary Spend")
plt.xlabel("Recency (Days since last purchase)")
plt.ylabel("Monetary Spend ($)")
plt.yscale("log")
plt.grid(True, linestyle="--", alpha=0.5)
plt.tight_layout()
plt.savefig("ml_pipeline/plots/clusters_scatter.png", dpi=300)
plt.close()

print("Evaluation figures generated at ml_pipeline/plots/")
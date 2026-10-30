# E-Commerce Real-Time Customer Segmentation Platform

A full-stack e-commerce system that combines real-time transactional workflows with an unsupervised machine learning pipeline. The platform segments customers dynamically based on **RFM (Recency, Frequency, Monetary)** behavioral features and applies real-time personalized loyalty discounts and complementary cross-sell recommendations.

---

## Key Features

* **Real-Time Transactional Engine:** Relational order logging using FastAPI and MySQL (XAMPP on port 3307), recording `orders` and granular `order_items` records upon checkout.
* **RFM Behavioral Segmentation:** Dynamic classification of shoppers into actionable tiers:
* **VIP / Continuous Buyers** (highest tier discount)
* **Loyal Regulars** (frequency incentives)
* **At-Risk / Low Interaction** (re-engagement coupons)
* **New Guests** (welcome onboarding offers)


* **Automated Behavioral Promotions:** Storefront dynamically evaluates user purchase history and unlocks tailored discount codes directly in the cart drawer.
* **Interactive ML Analytics Dashboard:**
* **2D Centroid Scatter Plot:** Visualizes customer coordinates (Recency vs. Monetary spend) using Recharts.
* **Segment Share Donut Chart:** Live percentage breakdown of active customer clusters.
* **Dynamic Online Retraining:** One-click trigger (`/api/admin/retrain`) to re-fit Scikit-Learn K-Means on live MySQL data and update artifacts without server downtime.


* **Smart Cross-Sell Recommendations:** Intelligent complementary add-on suggestions based on the shopper's active product browsing context.

---

## Tech Stack

* **Frontend:** React, Vite, Tailwind CSS, Recharts, Lucide React
* **Backend:** FastAPI, Uvicorn, Pydantic, PyMySQL
* **Machine Learning & Analytics:** Scikit-Learn (K-Means, StandardScaler), Pandas, NumPy, Joblib
* **Database:** MySQL (XAMPP)

---

## Architecture Overview

```text
ecommerce-customer-segmentation/
├── backend/
│   ├── main.py              # FastAPI endpoints, DB schemas, RFM engine, & retrain trigger
│   └── seed_data.py         # Seed script for initial catalog & historical transactions
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # React storefront, cart drawer, and Admin ML dashboard
│   │   └── main.jsx         # Application entry point
│   ├── package.json
│   └── tailwind.config.js
├── ml_pipeline/
│   └── customer_segmentation_model.joblib   # Persisted K-Means & Scaler artifacts
└── requirements.txt

```

---

## Quick Start

### 1. Database Setup

1. Launch **XAMPP Control Panel** and start **Apache** & **MySQL** (configured on port `3307`).
2. Create database:
```sql
CREATE DATABASE ecommerce_db;

```



### 2. Backend Setup

```powershell
# Activate Python virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run FastAPI backend
uvicorn backend.main:app --reload --port 8000

```

### 3. Frontend Setup

```powershell
cd frontend
npm install
npm run dev -- --force

```

Open `http://localhost:5173` to browse the store and test the Admin ML Dashboard.
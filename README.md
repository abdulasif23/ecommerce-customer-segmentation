# ecommerce-customer-segmentation# ApexStore: Behavioral Customer Segmentation Platform

An end-to-end e-commerce software architecture featuring a real-time Machine Learning customer segmentation engine powered by K-Means and RFM (Recency, Frequency, Monetary) modeling.

---

## 1. Problem Statement & Architecture
Most conventional e-commerce marketing systems rely on static demographic classifications (age, gender, location), leading to irrelevant campaigns and suboptimal conversions. 

This platform replaces demographic bucketing with real-time behavioral segmentation:
- **RFM Feature Engine:** Continuously tracks customer recency, purchase counts, and total spending.
- **K-Means Clustering:** Dynamically classifies users into actionable cohorts (*VIP / Champions*, *Loyal Regulars*, *At-Risk / Dormant*, *New / Exploring*).
- **Personalized Action Playbook:** Serves real-time discount coupons and targeted promotions via a customer storefront and provides an executive analytics dashboard for marketing teams.

---

## 2. Tech Stack
- **Frontend:** React (Vite), Tailwind CSS, Lucide Icons
- **Backend:** FastAPI (Python), SQLite, Pydantic, Uvicorn
- **Machine Learning:** Scikit-learn (K-Means, StandardScaler), Pandas, NumPy, Joblib
- **Version Control:** Git, GitHub

---

## 3. Project Structure
```text
ecommerce-customer-segmentation/
├── backend/
│   ├── main.py              # FastAPI server, endpoints & real-time inference
│   ├── seed_data.py         # Transaction synthesis script
│   └── requirements.txt     # Python backend dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Storefront and Admin Segmentation Dashboard
│   │   └── index.css        # Tailwind style directives
│   └── package.json
├── ml_pipeline/
│   ├── train_kmeans.py      # RFM feature engineering & K-Means training
│   └── customer_segmentation_model.joblib # Serialized model artifacts
└── README.md
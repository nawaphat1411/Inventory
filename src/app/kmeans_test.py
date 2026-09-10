import requests
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

# ตั้งค่าฟอนต์ภาษาไทยสำหรับ Matplotlib
plt.rcParams['font.family'] = 'Tahoma'
plt.rcParams['axes.unicode_minus'] = False

try:
    # 1. ดึงข้อมูลสินค้าจาก Express API
    url = "http://119.59.102.161:3025/api/products"
    response = requests.get(url)
    data = response.json()

    df = pd.DataFrame(data)

    # 2. ค้นหาคอลัมน์สต็อกอัตโนมัติ
    stock_col = None
    possible_cols = ['quantity', 'stock', 'amount', 'qty', 'stock_quantity']
    for col in possible_cols:
        if col in df.columns:
            stock_col = col
            break

    # แปลงข้อมูลเป็นตัวเลข
    df['price'] = pd.to_numeric(df['price'], errors='coerce').fillna(0)
    df[stock_col] = pd.to_numeric(df[stock_col], errors='coerce').fillna(0)

    # 3. เตรียมข้อมูลเข้าโมเดล K-Means
    X = df[['price', stock_col]]

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    k = min(4, len(df))
    kmeans = KMeans(n_clusters=k, random_state=42)
    df['cluster'] = kmeans.fit_predict(X_scaled)

    # 4. พลอตแสดงผลกราฟ
    plt.figure(figsize=(10, 6))
    scatter = plt.scatter(df['price'], df[stock_col], c=df['cluster'], cmap='viridis', s=150, alpha=0.8)

    centroids = scaler.inverse_transform(kmeans.cluster_centers_)
    plt.scatter(centroids[:, 0], centroids[:, 1], c='red', marker='X', s=250, label='Centroids')

    plt.title('การจัดกลุ่มสินค้าด้วย K-Means (ข้อมูลจริง)')
    plt.xlabel('ราคา (บาท)')
    plt.ylabel(f'จำนวนสต็อก ({stock_col})')
    plt.grid(True, linestyle='--', alpha=0.5)
    plt.legend()

    # แสดงชื่อสินค้ากำกับแต่ละจุด
    if 'name' in df.columns:
        for i, row in df.iterrows():
            plt.annotate(row['name'], (row['price'], row[stock_col]), fontsize=9, xytext=(5, 5), textcoords='offset points')

    plt.show()

except Exception as e:
    print("เกิดข้อผิดพลาด:", e)
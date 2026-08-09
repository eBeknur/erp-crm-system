# 🛒 Atigi Supermarket ERP & CRM System

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white)

Zamonaviy supermarket va savdo majmualari uchun mo'ljallangan ko'p do'konli (Multi-Tenant), real-time va yuqori unumdorlikka ega **ERP & CRM boshqaruv tizimi**.

---

## 🌟 Asosiy Imkoniyatlar (Core Features)

### 🛍 1. POS va Kassa (Point of Sale)
- Shtrix-kod skanerlash orqali tezkor savdo qilish.
- Ko'p turdagi to'lov turlarini qo'llab-quvvatlash: **Naqd**, **Bank kartasi**, **Click / Payme**.
- Nasiya (Kredit) savdo va mijozlar qarzdorlik balansi.

### 📦 2. Ombor va Mahsulotlar (Inventory & Warehouse)
- Mahsulotlar qoldig'i va minimal chegara ogohlantirishlari (Min Stock Alert).
- FIFO / Lot partiyalar harakati va ombor kirim-chiqim loglari.

### 🤝 3. Postavshiklar va Qarzdorlik (Suppliers & Debt Warning)
- Ta'minotchilar balansi va boshlang'ich qarz miqdori (`current_debt`).
- To'lov muddat kunlari (`due_days`) va to'lov vaqtining 80% o'tganida chiquvchi animatsiyali qizil ogohlantirish:
  > `⚠️ Oz vaqt qoldi, tezroq to'lov qiling!`

### 📸 4. Keldi-Ketdi va Foto-Isbot Nazorati (Attendance & Photo Proof)
- Ishchilar 09:00 smenaga kelish va ketishini telefon kamerasidan **Selfie rasmga tushish** orqali tasdiqlaydi.
- HTML5 Canvas yordamida rasmlar avtomatik **500px hajmga siqiladi (30 KB)** (100 barobar tezkor yuklanish).
- 10 daqiqagacha kechikish yashil badge, 10 daqiqadan ko'p kechikish qizil miltillovchi badge bilan adminga ko'rinadi.
- Toshkent vaqti (`Asia/Tashkent`, UTC+5) va GPS radiusi bilan aniq hisob-kitob.

### 👥 5. Ishchilar va Vakolatlar (Employees & RBAC)
- Lavozimlar: **Sotuvchi**, **Ishchi**, **Menedjer**, **HR Menejer**, **Admin**, **Developer**.
- `ISHCHI` va `SOTUVCHI` lavozimlari 100% teng vakolatga ega.

### 📊 6. Moliya va Audit (Finance & Audit Logs)
- Daromad/Xarajat balansi va tahlillar.
- Foydalanuvchilarning barcha harakatlari yozib boriluvchi to'liq Audit Log.

---

## 🛠 Texnologiyalar Steki (Tech Stack)

### Backend (Server)
- **Framework**: Python 3.12, [FastAPI](https://fastapi.tiangolo.com/)
- **ORM / DB**: SQLAlchemy 2.0, SQLite (WAL mode, PRAGMA cache=64MB)
- **Xavfsizlik**: Passlib (Bcrypt), PyJWT (JWT Authentication)
- **Server**: Uvicorn, Systemd service

### Frontend (Mijoz)
- **Framework**: React 18, [Vite](https://vitejs.dev/)
- **Til**: TypeScript
- **Styling**: Tailwind CSS, Lucide React (Icons)
- **HTTP Client**: Axios (Interceptors & Auto Auth)

### Deployment (Server Sozlamalari)
- **Server**: Ubuntu Linux VPS (`169.58.147.145`)
- **Web Server / Proxy**: Nginx (Reverse Proxy + Static SPA Host, Cache-Control Header Optimization)
- **SSL / HTTPS**: OpenSSL (Self-signed 10-year SSL for Camera/GPS permissions)

---

## 🔑 Boshlang'ich Login va Parollar (Default Credentials)

| Rol | Username | Parol | F.I.SH |
| :--- | :--- | :--- | :--- |
| **Bosh Admin** | `admin` | `Admin1234@` | Toshkent Admini |
| **Ishchi (Beknur)** | `Beknur` | `Beknur1234@` | Beknur Bozorov |
| **HR Menejer** | `hr_manager` | `Hr1234@` | Malika HR Menejer |
| **Chief Developer** | `developer` | `Dev1234@` | Beknur Developer |

---

## 🚀 Mahalliy Ishga Tushirish (Local Setup)

### 1. Repozitoriyani klonlash
```bash
git clone https://github.com/eBeknur/erp-crm-system.git
cd erp-crm-system
```

### 2. Backend (FastAPI) ishga tushirish
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate   # Windows

pip install -r requirements.txt
python reset_clean_data.py  # Bazani yaratish va seed qilish
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend (React) ishga tushirish
```bash
cd frontend
npm install
npm run dev
```

Brauzerda `http://localhost:5173` manziliga kiring.

---

## 🌐 Production Serverga Deploy Qilish (Automated Deploy)

Ushbu loyihada avtomatlashtirilgan Python SFTP/SSH deployer skripti (`run_vps.py`) mavjud:

```bash
# Backend virtualenv orqali deploy scriptini yurgazish
backend/venv/bin/python run_vps.py
```
Ushbu skript:
1. Frontend dist bundle-ni yig'adi.
2. SFTP orqali serverga (`169.58.147.145`) arxivlaydi va yuklaydi.
3. Systemd va Nginx sozlamalarini yangilab qayta ishga tushiradi.

---

## 📄 Litsenziya
Ushbu loyiha MIT litsenziyasi ostida tarqatiladi.

# 🎬 TasteFlix — AI-Powered Movie Recommendation System

> **Beyond Watching. Into Intelligence.**

TasteFlix is a full-stack AI-powered movie recommendation platform that delivers personalized movie suggestions using hybrid machine learning techniques, real-time user feedback, and explainable AI.

---

## 🚀 Live Features

- 🔐 Firebase Authentication (Email/Password, Google, GitHub)
- 🎯 Personalized Movie Recommendations
- 🧠 Hybrid ML Model (Collaborative + Content-Based)
- 💡 Explainable AI ("Why this movie?")
- ❤️ Real-time Feedback Learning (Like / Not Interested)
- 🎭 Mood-Based Filtering (Feel Good, Emotional, Action, etc.)
- 📊 User Taste Profile (Genre distribution)
- 🕘 Recommendation History Tracking
- 🔎 Smart Search & Exploration
- 🎥 Similar Movies Engine
- 🇮🇳 Bollywood + Hollywood Integration (TMDB API)

---

## 🧠 Machine Learning Overview

### 🔹 Model Type
Hybrid Recommendation System:
- **Collaborative Filtering (SVD)**
- **Content-Based Filtering (Cosine Similarity)**

### 🔹 Core Concepts Used
- Matrix Factorization (SVD)
- Cosine Similarity
- Sparse Matrix Handling
- Genre Vectorization
- Real-time Feedback Adaptation

### 🔹 Data Sources
- MovieLens Dataset (for training)
- TMDB API (for posters, metadata, Bollywood movies)

---

## ⚙️ Tech Stack

### 💻 Frontend
- Next.js (React)
- Tailwind CSS
- Framer Motion (animations)

### 🔙 Backend
- FastAPI (Python)
- REST API architecture

### 🧠 ML Layer
- Python
- scikit-learn
- NumPy / Pandas

### 🔐 Authentication & DB
- Firebase Authentication
- Firebase Firestore (user data, preferences)

### 🌐 APIs
- TMDB API (movie metadata, posters)

### 🚀 Deployment
- Frontend → Vercel  
- Backend → Render / Railway  

---

## 📊 System Architecture

User → Frontend (Next.js) → Backend API (FastAPI) → ML Model → Database (Firebase) → UI

---

## 🔄 Data Flow

1. User logs in (Firebase Auth)
2. Selects favorite movies / interacts with system
3. Backend processes input via ML model
4. Recommendations generated using hybrid filtering
5. TMDB API enriches results (posters, details)
6. Results displayed with explanations + confidence
7. User feedback updates preference profile
8. System improves recommendations over time

---

## 🧩 Key Features Explained

### 🎯 Personalized Recommendations
Uses collaborative + content-based filtering to generate highly relevant suggestions.

### 💡 Explainable AI
Each recommendation includes:
- Genre match %
- Similarity score
- "Because you liked X"

### ❤️ Feedback Learning
- 👍 Like → strengthens preference  
- 👎 Not Interested → reduces weight  

### 🎭 Mood-Based Discovery
Users can explore movies by mood:
- Feel Good 😄  
- Emotional 😢  
- Action Night 🔥  
- Mind-Bending 🤯  

### 📊 Taste Profile
Visual representation of user’s genre preferences.

### 🕘 History Tracking
Stores previous recommendation sessions with reasoning.

---

## 🔐 Authentication

Implemented using Firebase:
- Email/Password login  
- Google OAuth  
- GitHub OAuth  

---

## 📁 Project Structure

TasteFlix/
│
├── frontend/ (Next.js)
│   ├── components/
│   ├── pages/
│   ├── lib/firebase.js
│
├── backend/ (FastAPI)
│   ├── routes/
│   ├── models/
│   ├── services/
│
├── ml/
│   ├── model.py
│   ├── preprocessing.py
│
├── .env
└── README.md

---

## 🔧 Installation & Setup

### 1. Clone Repository

git clone https://github.com/your-username/tasteflix.git  
cd tasteflix  

---

### 2. Install Dependencies

cd frontend  
npm install  

cd ../backend  
pip install -r requirements.txt  

---

### 3. Run Project

# Frontend  
npm run dev  

# Backend  
uvicorn main:app --reload  

---

### 4. Environment Variables

Create `.env.local` in frontend:

NEXT_PUBLIC_FIREBASE_API_KEY=your_key  
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain  
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id  

---

## 📈 Future Enhancements

- 🤖 AI Chat-based Recommendations  
- 📈 Taste Evolution Tracking  
- 🎲 "Surprise Me" Feature  
- 📊 Advanced ML Metrics Dashboard  
- 🧠 Deep Learning-based Recommendations  

---

## 🎓 Academic Relevance

This project demonstrates:
- Real-world ML application  
- Hybrid recommendation systems  
- Explainable AI  
- Full-stack AI product development  

---

## 🧑‍💻 Author

**Rajat Nagda**

---

## ⭐ Final Note

TasteFlix is not just a project — it's a complete AI-driven product that blends machine learning, user experience, and real-world system design.

> “From data → intelligence → experience.”

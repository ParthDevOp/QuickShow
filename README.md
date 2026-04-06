# 🎬 QuickShow – Full Stack Movie Booking Platform

QuickShow is a production-ready **MERN stack movie ticket booking system** with real-time seat locking, secure authentication, and a complete admin management panel. It simulates real-world platforms like BookMyShow with scalable architecture and modern UI.

---

## 🚀 Live Demo

* 🌐 Frontend: https://quick-show-gilt-pi.vercel.app


---

## 🧠 Key Features

### 👤 User Features

* Secure authentication via Clerk
* Browse movies, shows, and theaters
* Real-time seat selection & booking
* Location-based city detection
* Snack & add-on selection
* Booking history & profile management
* Offers & discounts integration

---

### ⚡ Real-Time System (Core Highlight)

* Live seat locking using **Socket.IO**
* Prevents double booking
* Auto-release of inactive seats (TTL system)
* Multi-user synchronization

---

### 🛠️ Admin Features

* Admin role-based access
* Movie management (CRUD)
* Show scheduling & control
* Theater management
* Booking tracking dashboard
* Offer & discount management
* Support & request handling

---

### 🎯 Advanced Functionalities

* Secure API communication
* Clerk authentication integration
* Google Maps API (location detection)
* Background job processing (Inngest)
* Modular API architecture
* Environment-based configuration

---

## 🏗️ Tech Stack

### Frontend

* React.js (Vite)
* Axios
* Context API
* Tailwind CSS
* Clerk Authentication

### Backend

* Node.js
* Express.js
* MongoDB
* Socket.IO
* Inngest

### Deployment

* Frontend → Vercel
* Backend → Render (Private)
* Database → MongoDB Atlas

---

## 📁 Project Structure

```
QuickShow/
│
├── frontend/          
├── backend/           
│   ├── routes/
│   ├── controllers/
│   ├── configs/
│   ├── services/
│
├── README.md
```

---

## ⚙️ Configuration

> ⚠️ Sensitive environment variables and backend configurations are intentionally excluded for security reasons.

To run locally, create your own configuration files based on standard MERN setup practices.

---

## 🔌 Installation & Setup

```bash
git clone https://github.com/ParthDevOp/QuickShow.git
cd QuickShow
```

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Security Features

* Protected API routes
* Role-based access control
* Token-based authentication
* Secure environment handling
* CORS-restricted production setup

---

## ⚠️ Notes

* Backend endpoints are secured and not publicly exposed
* API keys and credentials are not included

---

## 🚀 Future Improvements

* Payment integration (Stripe/Razorpay)
* Push notifications
* Scalable socket architecture (Redis)
* AI-based recommendations
* Mobile application

---

## 👨‍💻 Author

**Parth Shah**

* GitHub: https://github.com/ParthDevOp
* Portfolio: https://parthdevop.github.io

---

## ⭐ Contribution

Contributions are welcome. Fork the repo and submit a PR.

---

## 📜 License

MIT License

---

## 💡 Final Note

This project demonstrates:

* Real-world MERN architecture
* Scalable backend design
* Real-time systems
* Production deployment workflow

Built with focus on **performance, scalability, and real-time interaction**.

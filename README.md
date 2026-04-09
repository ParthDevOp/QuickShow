# 🎬 QuickShow – Full Stack Movie Booking Platform

QuickShow is a production-ready **MERN stack movie ticket booking system** with real-time seat locking, secure authentication, multiple portals (Public, Cinema Staff, Super Admin), and a robust backend. It emulates real-world platforms like BookMyShow with scalable architecture and premium, modern UI.

---

## 🚀 Live Demo

* 🌐 Frontend: https://quick-show-gilt-pi.vercel.app

---

## 🧠 Key Features

### 👤 User Features
* Secure authentication via Clerk
* Browse movies, shows, and theaters
* Real-time seat selection & booking
* Location-based city detection (Google Maps API integration)
* Snack & add-on selection
* Booking history & profile management
* E-Ticket generation with viewable QR codes

### ⚡ Real-Time System (Core Highlight)
* Live seat locking using **Socket.IO**
* Prevents double booking in a multi-user environment
* Real-time synchronization across connected clients

### 🎬 Cinema Staff Portal
* Dedicated layout for theater operations
* POS / Box office terminal features
* Scan tickets via Web-cam (HTML5 QR Code)
* View Daily Manifests & snack orders
* Manage incoming schedule requests

### 🛠️ Admin Features
* Admin & super-admin role-based access
* Movie creation, deletion, and robust management (CRUD)
* Show and theater scheduling & control
* Booking tracking dashboard with insightful charts (Recharts)
* User & support management

---

## 🏗️ Detailed Tech Stack

### Frontend (Client)
- **Core Library:** React.js (v19)
- **Build Tool:** Vite (for fast HMR and compilation)
- **Routing:** React Router DOM (v7)
- **Styling:** Tailwind CSS (v4)
- **Animations:** Framer Motion, Lottie React
- **Icons:** Lucide React
- **Authentication:** Clerk React (`@clerk/clerk-react`)
- **Maps:** Leaflet, React-Leaflet
- **Data Visualization:** Recharts
- **Utilities:** Axios, HTML2Canvas, JSPDF (Ticket exports), QRCode, React Player

### Backend (Server)
- **Environment:** Node.js
- **Framework:** Express.js (v5)
- **Database:** MongoDB (via Mongoose for Object Data Modeling)
- **Authentication:** Clerk Express, JWT
- **Real-Time Communication:** Socket.IO
- **Background Jobs:** Inngest (Reliable background processing & task queues)
- **Media Storage:** Cloudinary
- **Payments:** Razorpay & Stripe integrations
- **Security:** bcryptjs, crypto, CORS, dotenv
- **Email Delivery:** Nodemailer
- **Webhooks:** Svix

### Deployment
- **Frontend** → Vercel
- **Database** → MongoDB Atlas

---

## 📁 Project Structure

```text
QuickShow-FullStack/
├── client/          # Frontend Web Application (React+Vite)
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/  # Reusable UI elements
│   │   ├── context/     # Global state logic (AppContext)
│   │   ├── pages/       # Route components divided into User, Admin, Cinema
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── server/          # Backend Node.js/Express API
│   ├── configs/     # DB & Cloud connections
│   ├── controllers/ # Business logic routing handlers
│   ├── inngest/     # Background job definitions
│   ├── middleware/  # Express middlewares (Auth, Error handling)
│   ├── models/      # Mongoose schemas
│   ├── routes/      # Express API endpoints
│   ├── scripts/
│   ├── server.js    # Entry point
│   └── package.json
│
└── README.md
```

---

## ⚙️ Configuration & Security Notes

> ⚠️ **Security First:** Sensitive environment variables, backend configuration keys, database URIs, API tokens, and Webhook secrets are strictly excluded from this repository and must be configured via a `.env` file in your local environment.

To run locally, you will need to provision your own keys for:
- MongoDB Cluster URI
- Clerk Publishable & Secret Keys
- Razorpay / Stripe credentials
- Cloudinary Name & Access Keys
- Google Maps / Inngest IDs



## 👨‍💻 Author

**Parth Shah**
* GitHub: https://github.com/ParthDevOp
* Portfolio: https://parthdevop.github.io




## 📜 License

MIT License

Built with a focus on **performance, scalability, and real-time cinematic user experiences.**

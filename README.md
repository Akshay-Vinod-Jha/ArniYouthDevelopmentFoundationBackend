# AYDF Backend - Arni Youth Development Foundation

Node.js backend API for the AYDF NGO website with MongoDB, JWT authentication, and Razorpay integration.

## 🚀 Tech Stack

- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Razorpay** - Payment gateway
- **Cloudinary** - Image hosting
- **Multer** - File uploads
- **bcryptjs** - Password hashing

## 📦 Installation

```bash
npm install
```

## ⚙️ Environment Setup

Create `.env` file:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=your_frontend_url
```

## 🏃 Development

```bash
npm run dev
```

Runs on `http://localhost:5000`

## 🔌 API Endpoints

### Auth

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Members

- `POST /api/members/register` - Member registration
- `POST /api/members/verify-payment` - Verify membership payment
- `GET /api/members/profile` - Get member profile

### Donations

- `POST /api/donations/create` - Create donation
- `POST /api/donations/verify` - Verify donation payment
- `GET /api/donations/stats` - Donation statistics

### Volunteers

- `POST /api/volunteers/apply` - Submit volunteer application
- `GET /api/volunteers` - List volunteers (Admin)

### Programs

- `GET /api/programs` - List all programs
- `GET /api/programs/:id` - Get program details

### Blog

- `GET /api/blog` - List published blogs
- `GET /api/blog/:slug` - Get blog by slug
- `POST /api/blog` - Create blog (Admin)

### Gallery

- `GET /api/gallery` - List gallery items
- `POST /api/gallery` - Upload gallery item (Admin)

### Contact

- `POST /api/contact` - Submit contact form
- `GET /api/contact` - List contacts (Admin)

### Board

- `GET /api/board` - List board members
- `POST /api/board` - Add board member (Admin)

## 🗄️ Database Models

- User
- Member
- Donation
- Volunteer
- Blog
- Gallery
- Contact
- Board

## 🔒 Security Features

- Helmet.js security headers
- Rate limiting
- JWT authentication
- Role-based authorization
- Input validation
- Password hashing
- CORS protection

## 📝 License

Private - AYDF Organization

---

**AYDF** - Building a better tomorrow for rural communities 🌾

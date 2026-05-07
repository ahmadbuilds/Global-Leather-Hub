# Global Leather Hub - E-Commerce Platform

A comprehensive wholesale e-commerce platform for leather products featuring a modern React frontend and robust Node.js/Express backend with MongoDB integration.

---

## Project Overview

Global Leather Hub is a full-stack e-commerce platform designed for wholesale leather product distribution. It supports:

- **User Management**: Registration, authentication, profile management
- **Product Catalog**: Browse, filter, and search leather products with pricing tiers
- **Shopping Cart**: Add/remove items and manage cart
- **Orders & Checkout**: Secure checkout with Stripe integration
- **Admin Dashboard**: Manage products, orders, and customers
- **International Shipping**: Multi-country support with live currency conversion
- **Admin Panel**: Full administrative capabilities for product and order management

---

## Features

### Frontend Features

- Responsive design with Tailwind CSS
- Real-time cart management
- User authentication and protected routes
- Admin dashboard for management
- Product filtering and search
- Cloudflare Turnstile bot protection
- Toast notifications for user feedback
- Smooth scrolling with Lenis

### Backend Features

- JWT-based authentication
- Role-based access control (User/Admin)
- Email verification with OTP
- Password management and recovery
- Product management with image uploads (Cloudinary)
- Shopping cart synchronization
- Order management and payment processing (Stripe)
- Real-time currency conversion
- Request rate limiting
- Comprehensive error handling and logging
- Security headers with Helmet
- XSS protection

---

## Tech Stack

### Frontend

- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.3.1
- **Styling**: Tailwind CSS 3.4.4
- **HTTP Client**: Axios 1.7.2
- **Routing**: React Router DOM 6.24.1
- **State Management**: React Context API
- **UI Components**: Lucide React Icons
- **Charts**: Recharts 3.8.1
- **Notifications**: React Hot Toast 2.4.1
- **Utilities**: libphonenumber-js, country-state-city

### Backend

- **Runtime**: Node.js
- **Framework**: Express 4.19.2
- **Database**: MongoDB with Mongoose 8.5.1
- **Authentication**: JWT (jsonwebtoken 9.0.2), bcryptjs 2.4.3
- **File Uploads**: Multer 2.1.1, Cloudinary
- **Email**: Nodemailer 6.9.14
- **Payments**: Stripe 22.0.0
- **Validation**: express-validator 7.2.0
- **Logging**: Winston 3.13.0
- **Security**: Helmet 7.1.0, express-rate-limit 7.4.0, xss-clean
- **Utilities**: Morgan (logging), CORS

---

## Project Structure

### Backend Structure

```
backend/
├── API_DOCUMENTATION.md        # Comprehensive API endpoints documentation
├── package.json                # Backend dependencies and scripts
├── server.js                   # Application entry point
├── logs/                       # Application logs directory
├── src/
│   ├── app.js                  # Express application configuration
│   ├── config/
│   │   └── database.js         # MongoDB connection configuration
│   ├── controllers/            # Route handlers and business logic
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── cartController.js
│   │   ├── contactController.js
│   │   ├── paymentController.js
│   │   ├── productController.js
│   │   ├── shippingController.js
│   │   └── userController.js
│   ├── middleware/             # Express middleware functions
│   │   ├── auth.js             # JWT authentication middleware
│   │   ├── cloudflare.js       # Cloudflare Turnstile verification
│   │   ├── errorHandler.js     # Global error handling
│   │   ├── upload.js           # Multer file upload configuration
│   │   └── validate.js         # Input validation middleware
│   ├── models/                 # MongoDB schemas and models
│   │   ├── Cart.js
│   │   ├── Order.js
│   │   ├── Product.js
│   │   └── User.js
│   ├── routes/                 # API route definitions
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── cartRoutes.js
│   │   ├── contactRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── productRoutes.js
│   │   ├── shippingRoutes.js
│   │   └── userRoutes.js
│   ├── services/               # Business logic and external service integrations
│   │   ├── currencyScheduler.js # Scheduled currency update service
│   │   └── CurrencyService.js
│   ├── utils/                  # Utility functions and helpers
│   │   ├── cloudinary.js       # Cloudinary image upload helper
│   │   ├── email.js            # Email sending utility
│   │   ├── jwt.js              # JWT token generation and verification
│   │   ├── logger.js           # Winston logger configuration
│   │   ├── otp.js              # OTP generation and management
│   │   ├── pricingTiers.js     # Pricing tier utilities
│   │   ├── productCartSync.js  # Cart-product synchronization
│   │   ├── shippingValidation.js # Shipping address validation
│   │   └── stripeClient.js     # Stripe client initialization
│   └── validators/             # Input validation schemas
│       ├── adminValidators.js
│       └── authValidators.js
```

### Frontend Structure

```
frontend/
├── eslint.config.js            # ESLint configuration
├── index.html                  # HTML entry point
├── package.json                # Frontend dependencies and scripts
├── postcss.config.js           # PostCSS configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── vite.config.js              # Vite build configuration
├── public/
│   └── images/                 # Static images
├── src/
│   ├── App.jsx                 # Root React component
│   ├── main.jsx                # Vite entry point
│   ├── index.css               # Global styles
│   ├── components/             # Reusable React components
│   │   ├── AdminLayout.jsx     # Admin layout wrapper
│   │   ├── AdminRoute.jsx      # Admin route protection
│   │   ├── CloudflareTurnstile.jsx # Captcha component
│   │   ├── Navbar.jsx          # Navigation bar
│   │   └── ProtectedRoute.jsx  # User route protection
│   ├── context/                # React Context for state management
│   │   └── authContext.jsx     # Authentication context
│   ├── hooks/                  # Custom React hooks
│   │   └── useScrollReveal.js  # Scroll reveal animation hook
│   ├── pages/                  # Page components (routes)
│   │   ├── AboutPage.jsx
│   │   ├── CartPage.jsx
│   │   ├── CheckoutSuccessPage.jsx
│   │   ├── ContactPage.jsx
│   │   ├── InternationalOrderPage.jsx
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── OrderDetailPage.jsx
│   │   ├── OrdersPage.jsx
│   │   ├── ProductDetailPage.jsx
│   │   ├── ProductsPage.jsx
│   │   ├── ProfilePage.jsx
│   │   ├── RegisterPage.jsx
│   │   └── admin/              # Admin pages
│   │       ├── AdminCustomers.jsx
│   │       ├── AdminDashboard.jsx
│   │       ├── AdminOrders.jsx
│   │       ├── AdminProductForm.jsx
│   │       └── AdminProducts.jsx
│   └── utils/                  # Utility functions and helpers
│       ├── api.js              # Axios API client configuration
│       ├── currency.js         # Currency conversion utilities
│       └── pricingTiers.js     # Pricing tier utilities
```

---

## Installation & Setup

### Prerequisites

Ensure you have the following installed on your system:

- **Node.js** (v14.0.0 or higher)
- **npm** (v6.0.0 or higher)
- **MongoDB** (Local instance or MongoDB Atlas cloud)
- **Git**

### Backend Setup

1. **Navigate to backend directory:**

   ```bash
   cd backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Create `.env` file in the backend root directory** (see [Backend .env](#backend-env) section)

4. **Verify database connection:**
   ```bash
   npm run dev
   ```
   You should see: `Server running on port 5000`

### Frontend Setup

1. **Navigate to frontend directory:**

   ```bash
   cd frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Create `.env` file in the frontend root directory** (see [Frontend .env](#frontend-env) section)

4. **Start development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

---

## Environment Variables

### Backend .env

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Server
PORT=5000
REQUEST_LOG_FORMAT=dev
LOG_LEVEL=debug
EXPOSE_ERROR_STACK=true
TURNSTILE_SKIP_VERIFY=false

# MongoDB
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<db>

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-jwt-refresh-secret
JWT_REFRESH_EXPIRE=30d

# EmailJS
EMAILJS_SERVICE_ID=your-emailjs-service-id
EMAILJS_TEMPLATE_ID=your-emailjs-template-id
EMAILJS_PUBLIC_KEY=your-emailjs-public-key
EMAILJS_PRIVATE_KEY=your-emailjs-private-key

# Cloudflare Turnstile
CLOUDFLARE_TURNSTILE_SECRET=your-turnstile-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173

# OTP
OTP_EXPIRE_MINUTES=10

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

**Important Notes:**

- Change `JWT_SECRET` and `JWT_REFRESH_SECRET` in production
- Use environment-specific configurations for development, staging, and production
- Keep sensitive keys secure and never commit `.env` to version control

### Frontend .env

Create a `.env` file in the `frontend/` directory with the following variables:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_BACKEND_URL=http://localhost:5000

# Cloudflare Turnstile (Bot Protection)
VITE_CF_TURNSTILE_SITE_KEY=your-cloudflare-site-key
```

**Important Notes:**

- `VITE_` prefix is required for Vite to expose variables to the browser
- `VITE_API_URL` should point to the backend base URL, while `CLIENT_URL` should match the frontend origin for CORS
- Cloudflare Site Key is public and can be exposed
- Never expose secret keys on the frontend

---

## Running the Application

### Start Backend Server

```bash
cd backend

# Development mode (with auto-reload via nodemon)
npm run dev

# Production mode
npm start

# Run tests
npm test
```

The backend will run on `http://localhost:5000`

### Start Frontend Development Server

```bash
cd frontend

# Development mode
npm run dev

# Build for production
npm run build

# Preview production build locally
npm preview

# Lint code
npm run lint
```

The frontend will run on `http://localhost:5173`

### Running Both Simultaneously

**Option 1: Using separate terminals**

- Terminal 1: `cd backend && npm run dev`
- Terminal 2: `cd frontend && npm run dev`

**Option 2: Using a process manager (optional)**
Install and use `concurrently`:

```bash
npm install -g concurrently
concurrently "cd backend && npm run dev" "cd frontend && npm run dev"
```

---

## Available Scripts

### Backend Scripts

| Script | Command       | Description                             |
| ------ | ------------- | --------------------------------------- |
| Start  | `npm start`   | Run server in production mode           |
| Dev    | `npm run dev` | Run server with nodemon for development |
| Test   | `npm test`    | Run Jest test suite                     |

### Frontend Scripts

| Script  | Command         | Description                      |
| ------- | --------------- | -------------------------------- |
| Dev     | `npm run dev`   | Start Vite development server    |
| Build   | `npm run build` | Build for production             |
| Preview | `npm preview`   | Preview production build locally |
| Lint    | `npm run lint`  | Run ESLint for code quality      |

---

## API Documentation

For comprehensive API endpoint documentation, see [backend/API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md)

### Quick API Reference

**Base URL:** `http://localhost:5000/api`

**Main Endpoint Groups:**

- **Health**: `/health` - Server status
- **Authentication**: `/auth` - Register, login, OTP verification
- **Users**: `/users/me` - Profile, orders, preferences
- **Products**: `/products` - Product catalog
- **Cart**: `/cart` - Shopping cart operations
- **Orders**: `/users/me/orders` - User orders
- **Admin**: `/admin` - Administrative functions
- **Webhooks**: `/webhooks/stripe` - Stripe payment webhooks

---

## Project Structure Details

### Key Directories Explained

#### Backend

- **`controllers/`**: Contains all route handlers with business logic
- **`models/`**: MongoDB Mongoose schemas for data structure
- **`middleware/`**: Custom middleware for authentication, validation, error handling
- **`routes/`**: Express route definitions linking endpoints to controllers
- **`services/`**: External service integrations (currency, email, etc.)
- **`utils/`**: Helper functions for common operations
- **`config/`**: Application configuration (database, etc.)

#### Frontend

- **`pages/`**: Page components corresponding to routes
- **`components/`**: Reusable UI components
- **`context/`**: React Context for global state (authentication)
- **`hooks/`**: Custom React hooks
- **`utils/`**: Helper functions and API client setup
- **`public/`**: Static assets

---

## Security Considerations

- **JWT Tokens**: Stored securely and validated on protected routes
- **Password Security**: Hashed using bcryptjs
- **Rate Limiting**: Applied to auth endpoints to prevent brute force
- **XSS Protection**: Using xss-clean middleware
- **CORS**: Configured to allow requests only from frontend URL
- **Helmet**: Security headers configured
- **Input Validation**: All inputs validated using express-validator
- **Environment Variables**: Sensitive data stored in .env (never committed)

---

## Troubleshooting

### Backend Issues

**Server fails to start:**

- Verify MongoDB connection string in `.env`
- Check if port 5000 is available
- Ensure all required environment variables are set

**Database connection error:**

- Verify MongoDB is running (local) or accessible (MongoDB Atlas)
- Check credentials in `MONGODB_URI`

### Frontend Issues

**API requests failing:**

- Verify backend is running on correct port
- Check `VITE_API_URL` in `.env`
- Clear browser cache and restart dev server

**Styles not loading:**

- Run `npm install` to ensure Tailwind dependencies
- Restart dev server after installing packages

---

## 📞 Support

For issues or questions:

1. Check the API documentation in `backend/API_DOCUMENTATION.md`
2. Review environment variables configuration
3. Check console logs for error messages
4. Verify all services (MongoDB, etc.) are running

---

## 📝 License

This project is proprietary software. All rights reserved.

---

**Last Updated**: May 3, 2026

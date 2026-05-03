# Global Leather Hub API Documentation

This document outlines all the available API endpoints in the Global Leather Hub backend.
The base URL for all endpoints is `/api`.

**Standard Response Format:**
Unless otherwise specified, all successful responses return a 200 OK status with the following JSON structure:
```json
{
  "success": true,
  "message": "Optional success message",
  "data": { ... }
}
```

---

## 1. System Health & Webhooks
Endpoints for server status and external webhooks.

| Method | Endpoint | Request Payload | Response Data | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | None | `{ timestamp, message }` | No |
| `POST` | `/webhooks/stripe` | Raw Buffer | `{ received: true }` | No (Uses Stripe Signature) |

---

## 2. Authentication (`/auth`)
Handles user registration, login, session management, and email verification.

| Method | Endpoint | Request Payload | Response Data | Auth | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | `{ username, email, password, cfTurnstileToken }` | `{ user, token }` | No | Rate limited |
| `POST` | `/auth/login` | `{ email, password, cfTurnstileToken }` | `{ user, token }` | No | Rate limited |
| `POST` | `/auth/verify-email` | `{ email, otp }` | `{ user, token }` | No | Rate limited |
| `POST` | `/auth/resend-otp` | `{ email }` | `{ message }` | No | Rate limited |
| `POST` | `/auth/refresh-token`| None (Uses Cookie) | `{ token }` | No | Sets new cookie |
| `POST` | `/auth/logout` | None | `{ message }` | Yes | Clears cookie |

---

## 3. Users (`/users/me`)
Manages the authenticated user's profile, settings, and orders. All endpoints require authentication.

| Method | Endpoint | Request Payload | Response Data |
| :--- | :--- | :--- | :--- |
| `GET` | `/users/me` | None | `{ user }` |
| `PATCH` | `/users/me/username` | `{ username }` | `{ user }` |
| `PATCH` | `/users/me/profile` | `{ company, country, phone }` | `{ user }` |
| `PATCH` | `/users/me/avatar` | `multipart/form-data` (`avatar` file) | `{ user }` |
| `PATCH` | `/users/me/preferred-currency`| `{ preferredCurrency }` | `{ user }` |
| `POST` | `/users/me/request-password-change`| None | `{ message }` |
| `PATCH` | `/users/me/change-password` | `{ otp, password, confirmPassword }` | `{ message }` |
| `GET` | `/users/me/orders` | None (Query: `?page=1&limit=10`) | `{ orders, pagination }` |
| `GET` | `/users/me/orders/:id` | None | `{ order }` |

---

## 4. Admin (`/admin`)
Administrative endpoints. All endpoints require authentication and an `admin` role.

| Method | Endpoint | Request Payload | Response Data |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin/dashboard` | None | `{ stats }` |
| `GET` | `/admin/dashboard/analytics` | None | `{ chartData }` |
| `GET` | `/admin/products` | None | `{ products, pagination }` |
| `GET` | `/admin/products/:id` | None | `{ product }` |
| `POST` | `/admin/products` | `multipart/form-data` (`name`, `description`, `category`, `moq`, `status`, `pricingTiers` array, up to 5 `images` files) | `{ product }` |
| `PUT` | `/admin/products/:id` | `multipart/form-data` (Same fields as POST) | `{ product }` |
| `DELETE`| `/admin/products/:id` | None | `{ message }` |
| `GET` | `/admin/orders` | None | `{ orders, pagination }` |
| `GET` | `/admin/orders/:id` | None | `{ order }` |
| `PATCH` | `/admin/orders/:id/status` | `{ status }` (pending, confirmed, processing, shipped, delivered, cancelled) | `{ order }` |
| `GET` | `/admin/customers` | None | `{ customers, pagination }` |

---

## 5. Products (`/products`)
Public product catalog endpoints. Optional authentication applies user-specific formatting (like currency).

| Method | Endpoint | Request Payload | Response Data | Auth |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/products` | None (Query: `?category=...&search=...&page=1`) | `{ products, pagination, categories }` | Optional |
| `GET` | `/products/:id` | None | `{ product, relatedProducts }` | Optional |

---

## 6. Cart (`/cart`)
Shopping cart operations. All endpoints require authentication.

| Method | Endpoint | Request Payload | Response Data |
| :--- | :--- | :--- | :--- |
| `GET` | `/cart` | None | `{ items, totalAmount, currency }` |
| `POST` | `/cart` | `{ productId, quantity }` | `{ items, totalAmount, currency }` |
| `PATCH` | `/cart/item/:productId` | `{ quantity }` | `{ items, totalAmount, currency }` |
| `DELETE`| `/cart/item/:productId` | None | `{ items, totalAmount, currency }` |
| `DELETE`| `/cart` | None | `{ items, totalAmount, currency }` |
| `POST` | `/cart/checkout-session`| `{ notes, shippingAddress: { fullName, country, countryCode, city, state, postalCode, address, phone } }` | `{ url, sessionId, orderId }` |

---

## 7. Payments (`/payments`)
Payment verification and session management.

| Method | Endpoint | Request Payload | Response Data | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/payments/verify-session` | None (Query: `?session_id=...`) | `{ order, paymentStatus }` | Yes |
| `POST` | `/payments/create-checkout-session` | Alias of `/cart/checkout-session` | `{ url, sessionId, orderId }` | Yes |

---

## 8. Shipping (`/shipping`)
Shipping validation and geographical data.

| Method | Endpoint | Request Payload | Response Data | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/shipping/countries` | None | `{ countries }` | No |
| `POST` | `/shipping/validate` | `{ fullName, country, countryCode, city, state, postalCode, address, phone, latitude, longitude }` | `{ errors, shippingAddress }` | Yes |
| `POST` | `/shipping/save` | `{ fullName, country, countryCode, city, state, postalCode, address, phone, latitude, longitude }` | `{ message, user }` | Yes |

---

## 9. Contact (`/contact`)
Public contact form.

| Method | Endpoint | Request Payload | Response Data | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/contact` | `{ name, email, company, country, inquiryType, message }` | `{ messageId }` | No |

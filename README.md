# Nepal Market Hub

Build a complete, enterprise-grade, production-ready, fully responsive multi-vendor eCommerce platform using React.js, Vite, Bootstrap 5, Node.js, Express.js, MongoDB, JWT Authentication, Cloudinary, Stripe, eSewa, Khalti, Socket.io, and modern best practices.

The website must look premium, modern, clean, trustworthy, and perform like Amazon, Daraz, Alibaba, Etsy, or Flipkart.

Project Name:

Nepalium

(Make branding configurable.)

====================================================

TECH STACK (STRICT)

====================================================

Frontend

- React.js (Vite)

- React Router DOM v6

- Bootstrap 5

- Bootstrap Icons

- CSS3

- Framer Motion

- AOS

- Axios

- React Hook Form

- React Toastify

- Swiper.js

Backend

- Node.js

- Express.js

- MongoDB

- Mongoose

- JWT Authentication

- bcrypt

- Multer

- Cloudinary

- Nodemailer

- Socket.io

Payments

- eSewa

- Khalti

- Stripe

- Cash on Delivery

Storage

- MongoDB

- Local uploads + Cloudinary

====================================================

USER TYPES

====================================================

1. Guest

Can

Browse products

Search

Filter

View details

Register

Login

Become Seller

Contact support

Cannot purchase until login

----------------------------------------------------

2. Customer

Can

Purchase products

Add to cart

Wishlist

Review

Rate

Track orders

Download invoice

Request return

Request refund

Become Seller

Manage profile

View order history

Receive notifications

====================================================

3. Seller

Seller registration requires Admin approval.

Seller workflow

Customer

↓

Apply for Seller

↓

Admin Reviews Documents

↓

Approve or Reject

↓

Seller Dashboard Activated

Seller can

Add products

Edit products

Delete own products

Upload multiple images

Manage stock

View orders

Print invoice

Accept order

Reject order

Mark shipped

Mark delivered

Respond to reviews

Chat with buyers

View earnings

Generate reports

Withdraw balance

Cannot publish products directly.

Every newly added product goes to Admin approval.

====================================================

ADMIN

Full control

Dashboard

Manage users

Manage customers

Manage sellers

Approve seller applications

Reject seller applications

Suspend sellers

Delete sellers

Manage categories

Manage subcategories

Manage products

Approve products

Reject products

Edit products

Delete products

Manage orders

Manage returns

Manage coupons

Manage banners

Manage homepage

Manage advertisements

Manage provinces

Manage districts

Manage municipalities

Manage delivery charges

Manage payment methods

Manage notifications

Manage reviews

Generate analytics

Export reports

====================================================

PRODUCT APPROVAL FLOW

Seller uploads product

↓

Status = Pending

↓

Admin reviews

↓

Approve

↓

Visible on website

OR

Reject

↓

Seller receives rejection reason

====================================================

ORDER FLOW

Customer orders

↓

Payment

↓

Stock automatically decreases

↓

Seller receives notification

↓

Seller confirms

↓

Packed

↓

Shipped

↓

Delivered

↓

Order Completed

====================================================

INVENTORY SYSTEM

Automatically reduce stock

Prevent overselling

Low stock alerts

Out of stock badge

Automatic inventory update

====================================================

LOCATION SYSTEM

Complete Nepal Location

Province

District

Municipality

Ward

Village

Customer can search by

Province

District

Municipality

Nearby

Seller location

Filter products by

Province

District

Local seller

====================================================

PRODUCT TYPES

Vegetables

Fruits

Organic Products

Honey

Tea

Coffee

Herbs

Spices

Handicrafts

Clothing

Electronics

Furniture

Books

Livestock

Seeds

Tools

Medicines

Agriculture Equipment

Local Products

====================================================

PRODUCT PAGE

Large gallery

Zoom

360° image

Video

Seller information

Stock

Reviews

Ratings

Questions

Related products

Recently viewed

Share

Wishlist

Buy Now

Add to Cart

====================================================

SEARCH

Instant search

Suggestions

Recent searches

Popular searches

Filter by

Category

Province

District

Seller

Brand

Price

Rating

Availability

====================================================

CUSTOMER FEATURES

Cart

Wishlist

Coupons

Reward points

Wallet

Notifications

Returns

Refunds

Invoices

Downloads

Multiple addresses

Saved cards

Profile

====================================================

PAYMENT

eSewa

Khalti

Stripe

Cash on Delivery

Wallet

Secure payment flow

Payment success page

Payment failed page

====================================================

DELIVERY

Delivery estimate

Delivery tracking

Order tracking timeline

Live order status

====================================================

REAL TIME

Socket.io

Order notifications

Seller notifications

Admin notifications

Chat

====================================================

REVIEWS

Verified purchase only

Images

Ratings

Helpful votes

Replies

====================================================

SECURITY

JWT

Role Based Access

Password encryption

Rate limiting

Helmet

XSS protection

CSRF protection

Validation

====================================================

SEO

React Helmet Async

Schema

Meta tags

Open Graph

Sitemap

Robots

====================================================

RESPONSIVE

Desktop

Laptop

Tablet

Mobile

Landscape

====================================================

DESIGN

Professional

Premium

Modern

Dark + Light mode

Soft shadows

Rounded corners

Smooth animations

Glassmorphism

Gradient buttons

Hover animations

====================================================

HOME PAGE

Hero Slider

Featured Categories

Featured Products

Popular Products

Flash Sale

Today's Deals

Newest Products

Province Products

District Products

Top Sellers

Best Rated

Testimonials

Statistics

Newsletter

Blog

Partners

Footer

====================================================

PAGES

Home

About

Shop

Product Details

Categories

Province Products

District Products

Seller Store

Cart

Checkout

Wishlist

Compare

Blog

Contact

FAQ

Privacy

Terms

Refund Policy

Shipping Policy

Login

Register

Become Seller

Seller Dashboard

Customer Dashboard

Admin Dashboard

404

====================================================

SELLER DASHBOARD

Overview

Products

Orders

Analytics

Income

Withdraw

Reviews

Profile

Settings

====================================================

CUSTOMER DASHBOARD

Orders

Wishlist

Reviews

Addresses

Wallet

Notifications

Settings

====================================================

ADMIN DASHBOARD

Analytics

Charts

Orders

Products

Categories

Users

Sellers

Approvals

Payments

Coupons

Reports

Settings

====================================================

DATABASE

Users

Roles

Products

Categories

Subcategories

Orders

Order Items

Payments

Reviews

Coupons

Addresses

Notifications

Chats

Seller Applications

Withdrawals

Inventory Logs

====================================================

API

REST API

Authentication

Authorization

CRUD

Pagination

Filtering

Sorting

Search

File Upload

====================================================

FOLDER STRUCTURE

Use scalable enterprise architecture.

Separate

Frontend

Backend

Admin

Shared utilities

Components

Pages

Hooks

Contexts

Redux Toolkit

Services

Models

Controllers

Routes

Middleware

Utils

Validation

====================================================

QUALITY

No dummy skeleton.

Fully functional.

No console errors.

Responsive everywhere.

Production ready.

Clean architecture.

Reusable components.

Well-commented.

SEO friendly.

Accessible.

Optimized.

Fast loading.

Lazy loading.

Code splitting.

Image optimization.

Pagination.

Infinite scrolling where appropriate.

Professional README.

Include complete setup instructions.

The final result should look and behave like a real commercial marketplace similar to Amazon, Daraz, Etsy, and Alibaba, with a complete admin panel, seller approval workflow, customer dashboard, automatic stock management, Nepal province and district filtering, secure payments, order tracking, analytics, and a polished enterprise UI.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/64b1d90d-5ed4-4263-b6f6-db34d1130296).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

---

## Running locally

```sh
npm install
cp .env.example .env   # fill in your own values
npm run dev
```

The app starts on http://localhost:8080.

### Supabase (Lovable Cloud)
Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`
(and the server-side `SUPABASE_*` equivalents) in `.env`. Real secrets never go in the repo —
`.env` is git-ignored, `.env.example` documents the keys.

### Google login
Google sign-in uses the Lovable-managed OAuth broker and works on the preview/published
domains without extra setup. It does **not** work on `http://localhost` — use email/password
locally, or add your own Google OAuth client (Client ID + Secret) in Cloud → Users →
Authentication settings → Google, listing your local URL as an authorized redirect URI.

### eSewa
Without configuration the integration runs on eSewa's public test environment (`EPAYTEST`).
For real payments set `ESEWA_PRODUCT_CODE` and `ESEWA_SECRET_KEY` from your eSewa merchant
account. The manual "scan our QR" flow always works and is verified by an admin.

### Khalti
Set `KHALTI_SECRET_KEY` (and `KHALTI_ENV=live` for production) from the Khalti merchant
dashboard to enable the official "Pay with Khalti" redirect. Until then, only the QR +
transaction-ID flow is offered.

### Bank transfer
Edit `src/lib/bank.ts` with your bank name, account holder and account number, and place your
bank QR image at `public/images/bank-qr.png`. Buyers submit a reference number and optional
receipt (stored in the private `payment-receipts` bucket); admins approve or reject it under
`/admin` → Payments.

## GitHub sync
In the Lovable editor open the **+** menu → GitHub → Connect project, authorize the Lovable
GitHub App and create the repository. After that every change syncs both ways: pushes to
`main` appear in Lovable, and Lovable edits are committed to GitHub.

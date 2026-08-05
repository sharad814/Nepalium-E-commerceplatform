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

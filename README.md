# Pastry Shop

A pastry-shop web application with a React/Vite frontend, an Express/Mongoose API,
and MongoDB persistence.

## Project structure

```text
pastry/
|-- package.json                         # Root development commands
|-- package-lock.json                    # Locked root dependencies
|-- .gitignore                           # Root-level ignored files and secrets
|-- README.md                            # This project guide
|-- database/
|   `-- pastry-shop-db-design.md         # Database design notes
|-- backend/
|   |-- package.json                     # API dependencies and scripts
|   |-- package-lock.json                # Locked API dependencies
|   |-- app.js                           # Express app, middleware, API routing, uploads
|   |-- server.js                        # Loads config, connects database, starts API
|   |-- seeder.js                        # Optional sample-data seeder
|   |-- .gitignore                       # API-specific ignored files
|   |-- config/
|   |   |-- database.js                  # MongoDB connection and development fallback
|   |   `-- firebaseAdmin.js             # Firebase Admin authentication setup
|   |-- controllers/
|   |   |-- auth.js                      # Registration, login, profiles, passwords, users
|   |   |-- cart.js                      # Read and save customer carts
|   |   |-- catalog.js                   # Category and add-on management
|   |   |-- order.js                     # Checkout, orders, receipts, and sales
|   |   `-- product.js                   # Products, product reviews, and product sales
|   |-- middleware/
|   |   `-- auth.js                      # Authentication and role authorization
|   |-- models/
|   |   |-- addon.js                     # Add-on schema
|   |   |-- cart.js                      # Cart schema
|   |   |-- category.js                  # Category and subcategory schema
|   |   |-- order.js                     # Order schema
|   |   |-- product.js                   # Product schema and review summary fields
|   |   |-- review.js                    # Product review schema
|   |   `-- user.js                      # User schema
|   |-- routes/
|   |   |-- auth.js                      # Authentication and user API routes
|   |   |-- cart.js                      # Cart API routes
|   |   |-- catalog.js                   # Category and add-on API routes
|   |   |-- order.js                     # Order and sales API routes
|   |   `-- product.js                   # Product and review API routes
|   `-- utils/
|       |-- apiFeatures.js               # Product query filtering, search, pagination
|       |-- jwtToken.js                  # JWT creation and cookie response
|       |-- multer.js                    # Upload configuration
|       `-- sendEmail.js                 # Email delivery helper
`-- frontend/
    |-- package.json                     # UI dependencies and scripts
    |-- package-lock.json                # Locked UI dependencies
    |-- README.md                        # Original Vite template notes
    |-- .env.example                     # Frontend environment-variable template
    |-- .gitignore                       # UI-specific ignored files
    |-- eslint.config.js                 # ESLint configuration
    |-- index.html                       # Vite HTML entry page
    |-- vite.config.js                   # Vite build, environment, and API proxy config
    |-- vercel.json                      # Vercel deployment/rewrite configuration
    |-- public/
    |   |-- favicon.svg                 # Browser tab icon
    |   |-- icons.svg                   # Shared SVG icons
    |   `-- images/
    |       |-- crumb-co-logo.png        # Brand logo
    |       |-- order_success.png        # Order-success illustration
    |       `-- shopit_logo.png          # Additional logo image
    `-- src/
        |-- App.jsx                      # App state, shared layout, routes
        |-- App.css                      # App-level styles
        |-- index.css                    # Global styles
        |-- main.jsx                     # React entry point and Redux provider
        |-- store.js                     # Redux store and reducer registration
        |-- products.json                # Local/static product data
        |-- actions/
        |   |-- productActions.jsx       # Product API actions
        |   `-- userActions.jsx          # User and authentication API actions
        |-- assets/
        |   |-- hero.png                 # Hero image
        |   |-- react.svg                # Vite starter asset
        |   `-- vite.svg                 # Vite starter asset
        |-- constants/
        |   |-- cartConstants.js         # Cart action identifiers
        |   |-- orderConstants.js        # Order action identifiers
        |   |-- productConstants.jsx     # Product action identifiers
        |   `-- userConstants.jsx        # User action identifiers
        |-- reducers/
        |   |-- productReducers.jsx      # Product list and product details state
        |   `-- userReducers.jsx         # Authentication and user state
        `-- Components/
            |-- Home.jsx                 # Store home and product listing
            |-- Admin/
            |   |-- CatalogManagement.jsx # Admin category and add-on tools
            |   |-- Dashboard.jsx         # Admin dashboard and recent reviews/orders
            |   |-- Dashboard.css         # Admin dashboard styles
            |   |-- MonthlySalesChart.jsx # Monthly sales chart
            |   |-- NewProduct.jsx        # Create product form
            |   |-- OrdersList.jsx        # Admin order list
            |   |-- ProcessOrder.jsx      # Admin order detail/status management
            |   |-- ProductCustomizationEditor.jsx # Product option editor
            |   |-- ProductReviews.jsx    # Admin review search and deletion
            |   |-- ProductSalesChart.jsx # Product sales chart
            |   |-- ProductsList.jsx      # Admin product list and management
            |   |-- SideBar.jsx           # Admin navigation
            |   |-- UpdateProduct.jsx     # Edit product form
            |   |-- UpdateUser.jsx        # Edit user/admin details
            |   |-- UserSalesChart.jsx    # Customer sales chart
            |   `-- UsersList.jsx         # Admin customer list
            |-- Cart/
            |   |-- Cart.jsx              # Shopping cart
            |   |-- CheckoutSteps.jsx     # Checkout progress indicator
            |   |-- ConfirmOrder.jsx      # Review order before payment
            |   |-- OrderSuccess.jsx      # Checkout success page
            |   |-- Payment.jsx           # Payment and order submission
            |   `-- Shipping.jsx          # Shipping address form
            |-- Layout/
            |   |-- Footer.jsx            # Site footer
            |   |-- Header.jsx            # Site header and navigation
            |   |-- Loader.jsx            # Loading indicator
            |   |-- MetaData.jsx          # Page title metadata
            |   `-- Search.jsx            # Product search control
            |-- Order/
            |   |-- ListOrders.jsx        # Customer order history
            |   |-- OrderDetails.jsx      # Customer order details and receipt
            |   `-- OrderDetails.css      # Order detail styles
            |-- Product/
            |   |-- Product.jsx           # Product card
            |   `-- ProductDetails.jsx    # Product detail, cart, and review UI
            |-- Review/
            |   `-- ListReviews.jsx       # Customer-facing review list
            |-- Route/
            |   `-- ProtectedRoute.jsx    # Login/admin route guard
            |-- User/
            |   |-- ForgotPassword.jsx    # Request password reset
            |   |-- Login.jsx             # Login form
            |   |-- Login.css             # Login styles
            |   |-- NewPassword.jsx       # Set a new password from reset link
            |   |-- Profile.jsx           # View user profile
            |   |-- Register.jsx          # Create customer account
            |   |-- UpdatePassword.jsx    # Change current password
            |   |-- UpdateProfile.jsx     # Edit profile and avatar
            |   |-- UserDashboard.jsx     # Customer account overview
            |   `-- UserDashboard.css     # Customer dashboard styles
            `-- Utils/
                `-- helpers.jsx           # Shared frontend helper functions
```

## Commands

Run these from the project root unless a directory is specified.

| Command | Purpose |
| --- | --- |
| `npm install` | Install root-level development tools. |
| `npm run dev` | Start the backend and frontend together. |
| `npm start` | Alias for `npm run dev`. |
| `npm run dev:backend` | Start the API only (uses backend `start`, which runs Nodemon). |
| `npm run dev:frontend` | Start the Vite development server only. |
| `npm --prefix backend install` | Install backend dependencies. |
| `npm --prefix frontend install` | Install frontend dependencies. |
| `npm --prefix frontend run build` | Create the production frontend bundle in `frontend/dist`. |
| `npm --prefix frontend run lint` | Run ESLint across the frontend. |
| `npm --prefix frontend run dev` | Start Vite directly from the frontend folder. |
| `npm --prefix frontend run preview` | Preview a previously built frontend bundle. |
| `npm --prefix backend start` | Start the API with Nodemon. |
| `npm --prefix backend test` | Run the backend test script; currently this is a placeholder that exits with an error. |
| `npm --prefix backend run migrate:addons` | Runs `backend/migrations/addSprinkles.js` if provided. That file is not present in this repository. |
| `npm --prefix backend run migrate:sizes` | Runs `backend/migrations/addProductSizeOptions.js` if provided. That file is not present in this repository. |

### Local setup

1. Install root, backend, and frontend dependencies with the commands above.
2. Create `backend/config/.env` for server settings. The backend loads that file.
   `DB_URI` is optional for local development; the database connector has a local
   MongoDB default and a development-only in-memory fallback. Production should
   use a configured persistent database.
3. Create `frontend/.env` based on `frontend/.env.example`. The Vite configuration
   defaults the API path to `/api/v1` and proxies to `http://localhost:4001`.
4. Start both applications with `npm run dev`.

Do not commit environment files, private keys, database credentials, or other
secrets. The frontend `.env.example` contains variable names, not working values.

## Request flow

The browser entry point is `frontend/src/main.jsx`; routes and shared app state
are set up in `frontend/src/App.jsx`. Frontend API requests use the `/api/v1`
path. `backend/app.js` mounts the API route modules at that prefix, route modules
apply authentication/role middleware, and controllers perform the work using
the Mongoose models in `backend/models/`.

Uploaded files are served from `backend/uploads/` and are intentionally excluded
from version control. The seeder can populate a database with sample data, but
it deletes and recreates several collections; review `backend/seeder.js` before
running it against any database with data you need to keep.

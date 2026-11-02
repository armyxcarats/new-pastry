# Pastry Shop Database Design

This is the database foundation for the pastry shop ordering system inspired by the reference project.

## Core entities

- User
- Category
- Product
- AddOn
- Cart
- Review
- Order

## Relationships

- One user can have many carts and orders.
- One category can have many products.
- One product can belong to one category and optionally one subcategory.
- One product can have many reviews.
- One order can contain many order items.
- One cart can contain many cart items.
- Each order item references a product and stores selected customization values.

## Main fields

### User
- name
- email
- password
- phoneNumber
- deliveryAddress
- role
- isVerified
- createdAt

### Category
- name
- slug
- description
- image
- parentCategory
- isActive

### Product
- name
- slug
- description
- price
- stock
- category
- subCategory
- ingredients
- allergens
- images
- isAvailable
- rating
- numOfReviews
- customizationOptions
- addOns
- createdAt

### AddOn
- name
- category
- description
- price
- isActive

### Cart
- user or sessionId
- items[]
- selectedOptions
- subtotal
- updatedAt

### Review
- product
- user
- rating
- comment
- createdAt

### Order
- user
- orderType: pickup | delivery
- preferredDate
- preferredTime
- paymentMethod: card | gcash | cod
- shippingAddress
- orderItems[]
- subtotal
- shippingFee
- totalPrice
- orderStatus
- paymentStatus
- createdAt

## Recommended indexes

- email on User
- slug on Category and Product
- product on Review and OrderItem
- user on Cart and Order

## Notes

This is a starting database design for a pastry shop platform and can be expanded with admin dashboards, inventory logs, and delivery schedules.

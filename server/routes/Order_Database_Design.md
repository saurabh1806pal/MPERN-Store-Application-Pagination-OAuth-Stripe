There is one important architectural challenge.

Your order data is in PostgreSQL, but product inventory is in MongoDB. A Prisma transaction cannot atomically update both databases.

We'll therefore use a controlled workflow:
- Validate everything first.
- Reserve/decrement inventory using MongoDB's conditional atomic updates.
- Create the order using a PostgreSQL transaction.
- If order creation fails, restore the inventory that was reserved.
- Clear the cart only after successful order creation.
We'll also prevent overselling by checking inventory during the atomic update, not just during the initial product lookup.


These are the Customer facing API Endpoints
POST /api/orders - Create an Order
GET /api/orders — List the logged-in customer's orders.
GET /api/orders/:id — Get complete details of one order.


These are the ADMINS only API Endpoints
PATCH /api/admin/orders/:id/status — Allow admins to update order status.
PATCH /api/admin/orders/:id/payment — Allow admins to update payment status.
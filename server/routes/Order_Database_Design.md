There is one important architectural challenge.

Your order data is in PostgreSQL, but product inventory is in MongoDB. A Prisma transaction cannot atomically update both databases.

We'll therefore use a controlled workflow:
- Validate everything first.
- Reserve/decrement inventory using MongoDB's conditional atomic updates.
- Create the order using a PostgreSQL transaction.
- If order creation fails, restore the inventory that was reserved.
- Clear the cart only after successful order creation.
We'll also prevent overselling by checking inventory during the atomic update, not just during the initial product lookup.
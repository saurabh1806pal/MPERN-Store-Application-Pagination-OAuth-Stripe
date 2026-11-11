Method	Endpoint	Purpose
GET	/api/cart	Fetch current user's cart
POST	/api/cart/items	Add product
PATCH	/api/cart/items/:id	Update quantity
DELETE	/api/cart/items/:id	Remove product
DELETE	/api/cart	Clear cart



======== POSTMAN Testing =======


1. Add product
POST
 http://localhost:5050/api/cart/items

Request body — JSON:
{
  "productId": "YOUR_MONGODB_PRODUCT_ID",
  "quantity": 2
}


Expected result:
- Product added successfully.
- Cart item created in PostgreSQL.
- Subtotal calculated using the MongoDB product price.
2. Fetch cart
GET
 http://localhost:5050/api/cart

Expected response structure:
{
  "success": true,
  "cart": {
    "id": 1,
    "items": [
      {
        "id": 1,
        "productId": "YOUR_MONGODB_PRODUCT_ID",
        "quantity": 2,
        "product": {
          "name": "Example Product",
          "price": 500
        },
        "lineTotal": 1000
      }
    ],
    "totalItems": 2,
    "subtotal": 1000
  }
}


The product fields shown above are illustrative; your actual response will contain your MongoDB product document.
3. Update quantity
PATCH
 http://localhost:5050/api/cart/items/1

Request body:
{
  "quantity": 3
}


Expected: Quantity becomes 3 and subtotal is recalculated.
4. Remove product
DELETE
 http://localhost:5050/api/cart/items/1

Expected: The selected item is removed.
5. Clear cart
DELETE
 http://localhost:5050/api/cart

Expected: All cart items are deleted, but the cart itself remains.
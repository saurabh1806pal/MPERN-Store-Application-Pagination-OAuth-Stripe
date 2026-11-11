Method	Endpoint	Purpose
GET	/api/cart	Fetch current user's cart
POST	/api/cart/items	Add product
PATCH	/api/cart/items/:id	Update quantity
DELETE	/api/cart/items/:id	Remove product
DELETE	/api/cart	Clear cart
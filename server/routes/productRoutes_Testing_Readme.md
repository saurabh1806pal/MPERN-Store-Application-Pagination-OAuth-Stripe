Test A — Retrieve page 1

Returns up to 10 products.
/api/products?page=1&limit=10


Test B — Sort by price, cheapest first
/api/products?sortBy=price&order=asc



Test C — Search for keywords (in this case "keybaord")
/api/products?search=keyboard



Test D — Combine all features
/api/products?search=keyboard&sortBy=price&order=asc&page=1&limit=5
import Product from "../models/Product.js";

// POST /api/products

export const createProduct = async (req, res) => {
  try {
    const data = req.body;

    if (Array.isArray(data)) {
      const products = await Product.insertMany(data);

      return res.status(201).json({
        success: true,
        count: products.length,
        products,
      });
    }

    const product = await Product.create(data);

    return res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /api/products

export const getProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortBy = "createdAt",
            order = "desc",
            search = "",
            category,
        } = req.query;

        // Validate Pagination
        const currentPage = Math.max(1, parseInt(page, 10) || 1);
        const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

        // Allow only Sorted Fields
        const allowedSortFields = ["name", "price", "createdAt", "stock"];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
        const sortOrder = order === "asc" ? 1 : -1;

        // Build Search Filters
        const filters = {};
        if(search.trim()){
            filters.name = {
                $regex: search.trim(),
                $options: "i"
            };
        }
        if(category){
            filters.category = category;
        }

        // Pagination
        const skip = (currentPage - 1) * pageSize;

        // Execute Query
        const [products, totalProducts] = await Promise.all([
            Product.find(filters)
                .sort({ [sortField]: sortOrder })
                .skip(skip)
                .limit(pageSize),
            Product.countDocuments(filters)
        ]);

        res.status(200).json({
            message: "Products fetched successfully",
            success: true,
            products,
            totalProducts,
            currentPage,
            totalPages: Math.ceil(totalProducts / pageSize)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


/* Understand the important concepts
Pagination: skip() determines how many matching documents to skip, and limit() determines how many to return.

For page 3 with 10 products per page:

text{skip}=(3-1)\times10=20


Sorting: .sort({ price: 1 }) sorts prices in ascending order; .sort({ price: -1 }) sorts them in descending order.

Searching: $regex with $options: "i" performs a case-insensitive partial match on product names. For example, key can match Mechanical Keyboard.

Total count: countDocuments(filter) counts the matching products, using the same search and category filters as the results query.

Security: the sort field is allowlisted, and the page size is capped. 
For a production API, we should also escape regex metacharacters in user-supplied search strings and consider a MongoDB text index or dedicated search solution for larger catalogs. */
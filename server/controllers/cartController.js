import {prisma} from '../config/prisma.js';
import Product from '../models/Product.js';
import {getCartDetails, isValidProductId} from '../utils/cartHelpers.js';


// Get Cart Items

export const getCart = async (req, res) => {
    try{
        const cart = await getCartDetails(req.user.id);
        res.set("Cache-Control", "no-store");

        return res.status(200).json({
            success: true,
            message: "Cart retrieved successfully",
            cart,
            user: req.user,
        });

    }catch(error){
        console.error("Error fetching cart:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}


// --------------------------------------------------
// ADD PRODUCT TO CART
// POST /api/cart/items
// --------------------------------------------------

export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    const quantity = req.body.quantity ?? 1;

    // Validate product ID
    if (!isValidProductId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Validate quantity
    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
    }

    // Find product in MongoDB
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check stock
    if (product.quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Product is out of stock",
      });
    }

    // Find or create user's cart
    const cart = await prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    // Check whether product already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    const newQuantity =
      (existingItem?.quantity || 0) + quantity;

    // Ensure requested quantity does not exceed stock
    if (newQuantity > product.quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.quantity} units are available`,
      });
    }

    // Insert or update cart item
    await prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
      update: {
        quantity: newQuantity,
      },
      create: {
        cartId: cart.id,
        productId,
        quantity,
      },
    });

    const updatedCart = await getCartDetails(userId);

    return res.status(200).json({
      success: true,
      message: "Product added to cart successfully",
      cart: updatedCart,
    });

  } catch (error) {
    console.error("Add to Cart Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to add product to cart",
    });
  }
};

// --------------------------------------------------
// UPDATE CART ITEM QUANTITY
// PATCH /api/cart/items/:id
// --------------------------------------------------

export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = Number(req.params.id);
    const { quantity } = req.body;

    // Validate cart item ID
    if (!Number.isSafeInteger(itemId) || itemId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart item ID",
      });
    }

    // Validate quantity
    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
    }

    // Find item and verify cart ownership
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: {
          userId,
        },
      },
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    // Retrieve current product information
    const product = await Product.findById(
      cartItem.productId
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product no longer exists",
      });
    }

    // Validate available stock
    if (quantity > product.quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.quantity} units are available`,
      });
    }

    // Update quantity
    await prisma.cartItem.update({
      where: {
        id: itemId,
      },
      data: {
        quantity,
      },
    });

    const updatedCart = await getCartDetails(userId);

    return res.status(200).json({
      success: true,
      message: "Cart quantity updated successfully",
      cart: updatedCart,
    });

  } catch (error) {
    console.error("Update Cart Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update cart item",
    });
  }
};

// --------------------------------------------------
// REMOVE PRODUCT FROM CART
// DELETE /api/cart/items/:id
// --------------------------------------------------

export const removeCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = Number(req.params.id);

    // Validate cart item ID
    if (!Number.isSafeInteger(itemId) || itemId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart item ID",
      });
    }

    // Verify ownership
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: {
          userId,
        },
      },
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    // Delete cart item
    await prisma.cartItem.delete({
      where: {
        id: itemId,
      },
    });

    const updatedCart = await getCartDetails(userId);

    return res.status(200).json({
      success: true,
      message: "Product removed from cart successfully",
      cart: updatedCart,
    });

  } catch (error) {
    console.error("Remove Cart Item Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to remove cart item",
    });
  }
};

// --------------------------------------------------
// CLEAR CART
// DELETE /api/cart
// --------------------------------------------------

export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find user's cart
    const cart = await prisma.cart.findUnique({
      where: {
        userId,
      },
    });

    // Delete all items if cart exists
    if (cart) {
      await prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
        },
      });
    }

    const updatedCart = await getCartDetails(userId);

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      cart: updatedCart,
    });

  } catch (error) {
    console.error("Clear Cart Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to clear cart",
    });
  }
};
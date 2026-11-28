
import { prisma } from "../config/prisma.js";
import Product from "../models/Product.js";

const LOW_STOCK_THRESHOLD = 10;

export const getCartDetails = async (userId) => {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true },
  });

  // Create Cart if it doesn't exist.
  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: { items: true },
    });
  }

  const productIds = cart.items.map((item) => item.productId);

  const products = productIds.length
    ? await Product.find({
        _id: { $in: productIds },
      }).lean()
    : [];

  // Create a lookup map for faster product matching.
  const productMap = new Map(
    products.map((product) => [
      product._id.toString(),
      product,
    ]),
  );

  // Keep unavailable products visible in the cart.
  const items = cart.items.map((item) => {
    const product = productMap.get(item.productId) || null;

    const availableStock = product
      ? Number(product.quantity)
      : null;

    const isAvailable =
      product !== null && availableStock > 0;

    let stockStatus = "UNAVAILABLE";

    if (product) {
      if (availableStock <= 0) {
        stockStatus = "OUT_OF_STOCK";
      } else if (availableStock <= LOW_STOCK_THRESHOLD) {
        stockStatus = "LOW_STOCK";
      } else {
        stockStatus = "IN_STOCK";
      }
    }

    return {
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      product,

      isAvailable,
      availableStock,

      hasSufficientStock:
        isAvailable && item.quantity <= availableStock,

      stockStatus,

      lineTotal: product
        ? Number(product.price) * item.quantity
        : null,
    };
  });

  // Count all cart items, including unavailable products.
  const totalItems = items.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  // Exclude unavailable products from the subtotal.
  const subtotal = items.reduce(
    (total, item) => total + (item.lineTotal ?? 0),
    0,
  );

  return {
    id: cart.id,
    items,
    totalItems,
    subtotal,
  };
};

export const isValidProductId = (id) => {
  return (
    typeof id === "string" &&
    /^[a-f\d]{24}$/i.test(id)
  );
};

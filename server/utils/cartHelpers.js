import {prisma} from '../config/prisma.js';
import Product from '../models/Product.js';

export const getCartDetails = async (userId) => {
    let cart = await prisma.cart.findUnique({
        where: {userId},
        include: {items: true},
    });

    // Create Cart if it doesn't exist
    if(!cart) {
        cart = await prisma.cart.create({
            data: {userId},
            include: {items: true},
        })
    }

    const productIds = cart.items.map((item) => item.productId);

    const products = productIds.length ? await Product.find({
        _id: {$in: productIds},
    }).lean() : [];

    // Create a lookup map for faster product matching
    const productMap = new Map(products.map((product) => [product._id.toString(), product]));

    const items = cart.items.map((item) => {
        const product = productMap.get(item.productId) || null;

        return {
            id: item.id,
            productId: item.productId,
            quantity: item.quantity,
            product,
            lineTotal: product ? Number(product.price) * item.quantity : null,
        };
    });

    const validItems = items.filter((item) => item.product !== null);

    const totalItems = validItems.reduce((total, item) => total + item.quantity, 0);

    const subtotal = validItems.reduce((total, item) => total + (item.lineTotal || 0), 0);

    return {
        id: cart.id,
        items: validItems,
        totalItems,
        subtotal,
    };
}

export const isValidProductId = (id) => {
  return typeof id === "string" && /^[a-f\d]{24}$/i.test(id);
};
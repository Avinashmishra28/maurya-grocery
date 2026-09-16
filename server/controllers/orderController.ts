import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { inngest } from "../inngest/index.js";
import Stripe from 'stripe';

// Create order
// POST /api/orders

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    // Check if order items are empty
    if (!items || items.length === 0) {
      return res.status(400).json({
        message: "No order items",
      });
    }

    // Check shipping address
    if (!shippingAddress) {
      return res.status(400).json({
        message: "Shipping address is required",
      });
    }

    // Check payment method
    if (!["card", "cash"].includes(paymentMethod)) {
      return res.status(400).json({
        message: "Invalid payment method",
      });
    }

    // Look up actual prices from the database
    const productIds = items.map((i: any) => i.product);

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
    });

    const productMap: Record<string, (typeof products)[0]> = {};

    products.forEach((p: any) => {
      productMap[p.id] = p;
    });

    // Check if product is in stock
    for (const item of items) {
      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          message: "Invalid product quantity",
        });
      }

      const product = productMap[item.product];

      if (!product || (product.stock ?? 0) < item.quantity) {
        return res.status(404).json({
          message: "Product out of stock",
        });
      }
    }

    // Create order items using actual database product information
    const orderItems = items.map((item: any) => {
      const dbProduct = productMap[item.product];

      if (!dbProduct) {
        throw new Error(`Product ${item.product} not found`);
      }

      return {
        product: dbProduct.id,
        name: dbProduct.name,
        image: dbProduct.image,
        price: dbProduct.price,
        quantity: item.quantity,
        unit: dbProduct.unit,
      };
    });

    // Calculate subtotal
    const subtotal = orderItems.reduce(
      (sum: number, item: any) =>
        sum + item.price * item.quantity,
      0
    );

    // Delivery fee
    const deliveryFee = subtotal > 20 ? 0 : 1.99;

    // Tax
    const tax = Math.round(subtotal * 0.088 * 100) / 100;

    // Total
    const total =
      Math.round((subtotal + deliveryFee + tax) * 100) / 100;

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: req.user!.id,
        items: orderItems,
        shippingAddress,
        paymentMethod,
        subtotal,
        deliveryFee,
        tax,
        total,
        statusHistory: [
          {
            status: "Placed",
            note: "Order placed successfully",
            timestamp: new Date(),
          },
        ],
      },
    });

    // Decrease stock
    for (const item of orderItems) {
      await prisma.product.update({
        where: {
          id: item.product,
        },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    // Send stock update events for each product in the order
    for (const item of orderItems) {
      await inngest.send({
        name: "inventory/stock.updated",
        data: {
          productIds: item.product,
        },
      });
    }

    // Send order placed event
    await inngest.send({
      name: "order/placed",
      data: {
        orderId: order.id,
      },
    });

    // Card payment logic will be added later
    if (paymentMethod === "card") {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)
     // create session
const session = await stripe.checkout.sessions.create({
  success_url: `${req.headers.origin}/orders?clearCart=true`,
  cancel_url: `${req.headers.origin}/chekout`,
  line_items: [
    {
       price_data: {
        currency: "inr",
        product_data: {
          name: "Payment Groceeries"
        }, 
        unit_amount: Math.round(total * 100)
       },
       quantity: 1,
    },
  ],
  mode: 'payment',
  metadata: {orderId: order.id}
  });
  return res.json({url: session.url})
    }

    res.json({ order });
  } catch (error: any) {
    console.log(error);

    res.status(500).json({
      message: "Failed to create order",
      error: error.message,
    });
  }
};




// Get user's orders
// GET /api/orders

export const getUserOrders = async (
  req: Request,
  res: Response
) => {
  try {
    const { status } = req.query;

    const where: any = {
      userId: req.user!.id,
      NOT: [
        {
          paymentMethod: "card",
          isPaid: false,
        },
      ],
    };

    if (status && status !== "all") {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        deliveryPartner: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({ orders });
  } catch (error: any) {
    console.log(error);

    res.status(500).json({
      message: "Failed to get orders",
      error: error.message,
    });
  }
};


// Get single order
// GET /api/orders/:id

export const getOrder = async (
  req: Request,
  res: Response
) => {
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id as string,
        userId: req.user!.id,
      },
      include: {
        deliveryPartner: {
          select: {
            name: true,
            phone: true,
            avatar: true,
            vehicleType: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.json({ order });
  } catch (error: any) {
    console.log(error);

    res.status(500).json({
      message: "Failed to get order",
      error: error.message,
    });
  }
};


// Update order status (Admin)
// PUT /api/orders/:id/status

export const updateOrderStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const { status, note } = req.body;

    const order = await prisma.order.findUnique({
      where: {
        id: req.params.id as string,
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const allowedStatuses = [
      "Placed",
      "Confirmed",
      "Packed",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status",
      });
    }

    const history = (
      Array.isArray(order.statusHistory)
        ? order.statusHistory
        : []
    ) as any[];

    history.push({
      status,
      note: note || `Order ${status.toLowerCase()}`,
      timestamp: new Date(),
    });

    const updatedOrder = await prisma.order.update({
      where: {
        id: req.params.id as string,
      },
      data: {
        status,
        statusHistory: history,
      },
    });

    res.json({
      order: updatedOrder,
    });
  } catch (error: any) {
    console.log(error);

    res.status(500).json({
      message: "Failed to update order status",
      error: error.message,
    });
  }
};


// Get all orders (Admin)
// GET /api/orders/all

export const getAllOrders = async (
  req: Request,
  res: Response
) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        NOT: [
          {
            paymentMethod: "card",
            isPaid: false,
          },
        ],
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        deliveryPartner: {
          select: {
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({ orders });
  } catch (error: any) {
    console.log(error);

    res.status(500).json({
      message: "Failed to get all orders",
      error: error.message,
    });
  }
};


// Get Order Location
// GET /api/orders/:id/location

export const getOrderLocation = async (
  req: Request,
  res: Response
) => {
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id as string,
        userId: req.user!.id,
      },
      select: {
        liveLocation: true,
        status: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.json({
      liveLocation: order.liveLocation,
      status: order.status,
    });
  } catch (error: any) {
    console.log(error);

    res.status(500).json({
      message: "Failed to get order location",
      error: error.message,
    });
  }
};
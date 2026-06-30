import "server-only";

import { tool } from "ai";
import { z } from "zod";
import { callKaprukaTool } from "@/lib/mcp/client";

export const kaprukaTools = {
  search_products: tool({
    description:
      "Search Kapruka catalog by keyword with optional filters. Use for product discovery.",
    inputSchema: z.object({
      q: z.string().describe("Search query"),
      category: z.string().optional().describe("Category name filter"),
      min_price: z.number().optional(),
      max_price: z.number().optional(),
      in_stock_only: z.boolean().optional().default(true),
      sort: z
        .enum(["relevance", "price_asc", "price_desc", "name"])
        .optional()
        .default("relevance"),
      limit: z.number().optional().default(5),
      currency: z.string().optional().default("LKR"),
      response_format: z.enum(["markdown", "json"]).optional().default("json"),
    }),
    execute: async (params) => callKaprukaTool("kapruka_search_products", params),
  }),

  get_product: tool({
    description: "Get full details for a product by ID including images, variants, stock.",
    inputSchema: z.object({
      product_id: z.string().describe("Kapruka product ID"),
      currency: z.string().optional().default("LKR"),
      response_format: z.enum(["markdown", "json"]).optional().default("json"),
    }),
    execute: async (params) => callKaprukaTool("kapruka_get_product", params),
  }),

  list_categories: tool({
    description: "List top-level Kapruka categories for browsing.",
    inputSchema: z.object({
      depth: z.number().optional().default(1),
    }),
    execute: async (params) => callKaprukaTool("kapruka_list_categories", params),
  }),

  list_delivery_cities: tool({
    description:
      "Search delivery cities by name or vernacular alias. Use to find canonical city names.",
    inputSchema: z.object({
      query: z.string().describe("City name or alias"),
      limit: z.number().optional().default(10),
    }),
    execute: async (params) => callKaprukaTool("kapruka_list_delivery_cities", params),
  }),

  check_delivery: tool({
    description:
      "Check if delivery is available to a city on a date. Required before ordering cakes/flowers.",
    inputSchema: z.object({
      city: z.string().describe("Canonical delivery city name"),
      delivery_date: z.string().describe("Delivery date YYYY-MM-DD"),
      product_id: z.string().optional().describe("Product ID for perishable check"),
    }),
    execute: async (params) => callKaprukaTool("kapruka_check_delivery", params),
  }),

  create_order: tool({
    description:
      "Create guest checkout order. Returns click-to-pay URL. Prices locked 60 minutes. " +
      "City must be a canonical Kapruka delivery city (use list_delivery_cities first). " +
      "Delivery address goes in delivery.address, not recipient.",
    inputSchema: z.object({
      cart: z
        .array(
          z.object({
            product_id: z.string().describe("Kapruka product ID"),
            quantity: z.number().min(1).max(99).default(1),
            icing_text: z
              .string()
              .optional()
              .describe("Cake icing text — ignored for non-cake products"),
          })
        )
        .min(1)
        .max(30)
        .describe("Cart items (1–30)"),
      recipient: z.object({
        name: z.string().describe("Recipient name on the order"),
        phone: z
          .string()
          .describe("Recipient phone — E.164 (+9477…) or local SL (077…) format"),
      }),
      delivery: z.object({
        address: z.string().describe("Street delivery address"),
        city: z
          .string()
          .describe("Canonical Kapruka city from list_delivery_cities (e.g. 'Colombo 03')"),
        date: z.string().describe("Delivery date YYYY-MM-DD"),
        location_type: z
          .enum(["house", "apartment", "office", "other"])
          .optional()
          .default("house"),
        instructions: z.string().optional().describe("Free-form delivery instructions"),
      }),
      sender: z.object({
        name: z.string().describe("Sender name on the gift card"),
        anonymous: z
          .boolean()
          .optional()
          .default(false)
          .describe("If true, gift card shows 'Anonymous'"),
      }),
      gift_message: z.string().max(300).optional(),
      currency: z.string().optional().default("LKR"),
    }),
    execute: async (params) => callKaprukaTool("kapruka_create_order", params),
  }),

  track_order: tool({
    description: "Track order status and delivery progress by order number.",
    inputSchema: z.object({
      order_number: z.string().describe("Kapruka order number"),
    }),
    execute: async (params) => callKaprukaTool("kapruka_track_order", params),
  }),
};
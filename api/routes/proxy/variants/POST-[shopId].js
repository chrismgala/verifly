import { RouteHandler } from "gadget-server";

/**
 * Route handler for fetching product variants that need verification for a specific shop
 *
 * @type { RouteHandler } route handler - see: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = async ({ request, reply, api, logger }) => {
  try {
    const shopId = request.params.shopId;
    const { variantsInCart } = request.body;

    // Verify the shop exists
    const shop = await api.shopifyShop.maybeFindById(shopId);
    if (!shop) {
      return reply.code(404).send({ error: "Shop not found" });
    }

    if (variantsInCart.length === 0) {
      return reply.code(200).send({ variantIds: [] });
    }

    const variants = await api.shopifyProductVariant.findMany({
      filter: {
        id: {
          in: variantsInCart
        },
        shopId: {
          equals: shopId
        },
        needsVerification: {
          equals: true
        }
      },
      select: {
        id: true
      }
    });
    
    if (variants.length > 0) {
      logger.info({ shopId }, 'Retrieved variants needing verification');
      return reply.code(200).send({ variantIds: variants });
    } else {
      logger.info({ shopId }, 'No variants needing verification found');
      return reply.code(200).send({ variantIds: [] });
    }
  } catch (error) {
    logger.error({ error, shopId }, 'Failed to fetch variants needing verification');
    return reply.code(500).send({ error: "Failed to fetch variants needing verification" });
  }
};

route.options = {
  schema: {
    params: {
      type: "object",
      properties: {
        shopId: { type: "string" },
      },
      required: ["shopId"],
    },
    body: {
      type: "object",
      properties: {
        variantsInCart: { type: "array", items: { type: "string" } },
      },
      required: ["variantsInCart"],
    },
  }
};

export default route;

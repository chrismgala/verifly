import { RouteHandler } from "gadget-server";

/**
 * Route handler for fetching product variants that need verification for a specific shop
 *
 * @type { RouteHandler } route handler - see: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = async ({ request, reply, api, logger }) => {
  try {
    const shopId = request.params.shopId;

    // Verify the shop exists
    const shop = await api.shopifyShop.maybeFindById(shopId);
    if (!shop) {
      return reply.code(404).send({ error: "Shop not found" });
    }

    // Get all product variants that need verification for this shop
    const variantsNeedingVerification = await api.shopifyProductVariant.findMany({
      filter: {
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

    const variantIds = variantsNeedingVerification.map(variant => parseFloat(variant.id));

    logger.info({ shopId }, 'Retrieved variants needing verification');

    return reply.code(200).send({ 
      variantIds
    });

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
    }
  }
};

export default route;

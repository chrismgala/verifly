import { RouteHandler } from "gadget-server";

/**
 * Route handler for updating product verification settings
 *
 * @type { RouteHandler } route handler - see: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = async ({ request, reply, api, logger }) => {
  const shopId = request.params.shopId;
  const { selectedProductVariants, removedVariants } = request.body;

  try {
    // Update each product's needsVerification field
    const updatePromises = selectedProductVariants.map(async (variantId) => {
      try {
        await api.shopifyProductVariant.update(variantId, {
          needsVerification: true
        });
        return { id: variantId, success: true, type: 'variant' };
      } catch (error) {
        logger.error({ error, productId: variantId }, 'Failed to update product variant');
        return { id: variantId, success: false, error: error.message };
      }
    });

    const removePromises = removedVariants.map(async (variantId) => {
      try {
        await api.shopifyProductVariant.update(variantId, {
          needsVerification: false
        });
        return { id: variantId, success: true, type: 'variant' };
      } catch (error) {
        logger.error({ error, productId: variantId }, 'Failed to update product variant');
        return { id: variantId, success: false, error: error.message };
      }
    });

    const results = await Promise.all([...updatePromises, ...removePromises]);
    const successfulUpdates = results.filter(result => result.success);
    const failedUpdates = results.filter(result => !result.success);

    if (failedUpdates.length > 0) {
      logger.warn({ failedUpdates, shopId }, 'Some variant updates failed');
    }

    return reply.code(200).send({ 
      updated: successfulUpdates.length,
      failed: failedUpdates.length
    });

  } catch (error) {
    logger.error({ error, shopId }, 'Failed to update product verification settings');
    return reply.code(500).send({ error: "Failed to update product verification settings" });
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
        removedVariants: { type: "array", items: { type: "string" } },
        selectedProductVariants: { type: "array", items: { type: "string" } },
      },
      required: ["removedVariants", "selectedProductVariants"],
    },
  },
};

export default route; 
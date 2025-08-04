import { RouteHandler } from "gadget-server";

/**
 * Route handler for updating product verification settings
 *
 * @type { RouteHandler } route handler - see: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = async ({ request, reply, api, logger }) => {
  try {
    const shopId = request.params.shopId;
    const { productVariants } = request.body;

    if (!productVariants || !Array.isArray(productVariants)) {
      return reply.code(400).send({ error: "Invalid request body. Expected 'productVariants' array." });
    }

    // Update each product's needsVerification field
    const updatePromises = productVariants.map(async (variant) => {
      try {
        await api.shopifyProductVariant.update(variant.id, {
          needsVerification: variant.needsVerification
        });
        return { id: variant.id, success: true, type: 'variant' };
      } catch (error) {
        logger.error({ error, productId: variant.id }, `Failed to update product variant ${variant.id}`);
        return { id: variant.id, success: false, error: error.message };
      }
    });

    const results = await Promise.all(updatePromises);
    const successfulUpdates = results.filter(result => result.success);
    const failedUpdates = results.filter(result => !result.success);

    if (failedUpdates.length > 0) {
      logger.warn({ failedUpdates, shopId }, 'Some product updates failed');
    }

    return reply.code(200).send({ 
      message: "Updated product variants needing verification",
      updated: successfulUpdates.length,
      failed: failedUpdates.length,
      results
    });

  } catch (error) {
    logger.error({ error, shopId }, 'Failed to update product verification settings');
    return reply.code(500).send({ error: "Failed to update product verification settings" });
  }
};

export default route; 
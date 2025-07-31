import { RouteHandler } from "gadget-server";

/**
 * Route handler for updating product verification settings
 *
 * @type { RouteHandler } route handler - see: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = async ({ request, reply, api, logger }) => {
  try {
    const shopId = request.params.shopId;
    const { products } = request.body;

    if (!products || !Array.isArray(products)) {
      return reply.code(400).send({ error: "Invalid request body. Expected 'products' array." });
    }

    // Update each product's needsVerification field
    const updatePromises = products.map(async (product) => {
      try {
        await api.shopifyProduct.update(product.id, {
          shopifyProduct: {
            needsVerification: product.needsVerification
          }
        });
        return { id: product.id, success: true };
      } catch (error) {
        logger.error({ error, productId: product.id }, `Failed to update product ${product.id}`);
        return { id: product.id, success: false, error: error.message };
      }
    });

    const results = await Promise.all(updatePromises);
    const successfulUpdates = results.filter(result => result.success);
    const failedUpdates = results.filter(result => !result.success);

    if (failedUpdates.length > 0) {
      logger.warn({ failedUpdates, shopId }, 'Some product updates failed');
    }

    return reply.code(200).send({ 
      message: "Products needing verification updated",
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
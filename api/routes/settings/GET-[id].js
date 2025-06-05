import { RouteHandler } from "gadget-server";

/**
 * Route handler for order verifications
 *
 * @type { RouteHandler } route handler - see: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = async ({ request, reply, api, logger, connections }) => {  
  try {
    const shop = await api.shopifyShop.findOne(request.params.id);

    const { id, verificationsEnabled, triggerPrice, setupComplete } = shop;

    logger.info({ id }, "Retrieved shop settings");

    return reply.code(200).send({ 
      verificationsEnabled, 
      triggerPrice,
      setupComplete
    });
  } catch (error) {
    logger.error({ error, shopId: request.params.id }, "Failed to retrieve shop settings");
    return reply.code(500).send({ error: "Failed to retrieve shop settings" });
  }
}

export default route;
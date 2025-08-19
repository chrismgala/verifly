import { RouteHandler } from "gadget-server";

/**
 * Route handler for order verifications
 *
 * @type { RouteHandler } route handler - see: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = async ({ request, reply, api, logger, connections }) => {  
  const { 
    verificationsEnabled,
    triggerPrice,
    verificationFlow,
    setupComplete
  } = request.body;

  const shop = await api.shopifyShop.findOne(request.params.id);

  if (shop) {
    await api.shopifyShop.update(request.params.id, {
      verificationsEnabled,
      triggerPrice: parseFloat(triggerPrice),
      verificationFlow,
      setupComplete
    });
  }

  logger.info({ 
    verificationsEnabled, 
    triggerPrice, 
    verificationFlow, 
    shopId: shop.id 
  }, "Updating shop settings");

  return reply.code(200).send({ success: true});
}

export default route;
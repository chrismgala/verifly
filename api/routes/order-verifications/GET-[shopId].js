import { RouteHandler } from "gadget-server";

/**
 * Route handler for order verifications
 *
 * @type { RouteHandler } route handler - see: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = async ({ request, reply, api, logger, connections }) => {
  const transformedVerifications = [];

  const verifications = await api.verification.findMany({
    filter: {
      shopId: {
        equals: request.params.shopId
      }
    }
  });
  
  for (const verification of verifications) {
    const transformedVerification = {
      id: verification.id,
      sessionId: verification.sessionId,
      updatedAt: verification.updatedAt
    };

    try {
      // Order - using findOne with direct ID parameter
      const order = await api.shopifyOrder.findOne(verification.orderId);
      
      // Set order data
      transformedVerification.orderName = order.name
    } catch (error) {
      logger.error({ error, orderId: verification.orderId }, `Failed to fetch order for shop ${request.params.id}`);
      transformedVerification.order = {
        name: "Order not found"
      };
    }

    try {
      // Customer - using findFirst with filter by platformCustomerId
      const customer = await api.shopifyCustomer.findFirst({
        filter: {
          platformCustomerId: {
            equals: parseFloat(verification.customerId)
          }
        }
      });
      
      // Set customer data
      transformedVerification.customer = {
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        status: customer.status
      };
    } catch (error) {
      logger.error({ error, customerId: verification.customerId }, `Failed to fetch customer for shop ${request.params.id}`);
      transformedVerification.customer = {
        email: "Unknown",
        firstName: "Unknown",
        lastName: "Unknown",
        status: "unknown"
      };
    }

    transformedVerifications.push(transformedVerification);
    transformedVerifications.sort((verificationOne, verificationTwo) => verificationTwo.updatedAt - verificationOne.updatedAt);
  }

  return reply.code(200).send({ verifications: transformedVerifications });
}

export default route;
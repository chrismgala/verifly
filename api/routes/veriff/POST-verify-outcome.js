import { RouteHandler } from "gadget-server";

import { isSignatureValid } from '../../helpers/veriff';

/**
 * Route handler for stripe webhook
 *
 * @type { RouteHandler } route handler - see: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = async ({ request, reply, api, logger, connections }) => {
  let verificationId, verification;

  // Verify the event came from Stripe
  try {
    const signature = request.headers['x-hmac-signature'];
    const secret = process.env.VERIFF_SECRET_KEY;
    const payload = request.body;

    if (!isSignatureValid({ signature, secret, payload })) {
      logger.error('[Veriff - Verify Outcome] Invalid signature');
      return reply.code(400).send({ error: 'Invalid signature' });
    }

    const { data, vendorData } = payload;
    verification = data.verification;
    verificationId = vendorData;

    logger.info({ verificationId }, `[Veriff - Verify Outcome] Incoming verification decision`);
  } catch (error) {
    // On error, log and return the error message
    logger.error(`Veriff verification decision receipt failed: ${error.message}`);
    return reply.code(400).send({error: `Veriff verification decision receipt failed: ${error.message}`});
  }

  // First look for an existing verification record with this session ID
  const internalVerification = await api.verification.findById(verificationId);

  const shopId = internalVerification.shopId;
  
  const customer = await api.shopifyCustomer.findFirst({
    filter: {
      platformCustomerId: {
        equals: parseFloat(internalVerification.customerId)
      }
    }
  });
  const order = await api.shopifyOrder.findById(internalVerification.orderId);

  try {
    await api.verification.update(internalVerification.id, {
      status: verification.decision,
    });

    logger.info({ verificationId }, `[Veriff - Verify Outcome] Internal verification updated`);
  } catch (error) {
    logger.error({ verificationId }, `[Veriff - Verify Outcome] Unable to update internal verification`);
    return reply.code(500).send({error: `Unable to update internal verification: ${error.message}`});
  }

  try {
    await api.shopifyCustomer.update(customer.id, {
      status: verification.decision
    });
    logger.info({ customerId: customer.platformCustomerId }, `[Veriff - Verify Outcome] Customer status updated`);
  } catch (error) {
    logger.error({ customerId: customer.platformCustomerId }, `[Veriff - Verify Outcome] Unable to update customer status`);
    return reply.code(500).send({error: `Unable to update customer status: ${error.message}`});
  }

  switch (verification.decision) {
    case 'approved': {
      logger.info({ verificationId }, '[Veriff - Verify Outcome] Verification approved');
    }
    case 'declined': {
      logger.info({ verificationId }, '[Veriff - Verify Outcome] Verification denied');
    }
    case 'resubmission_request': {
      logger.info({ verificationId }, '[Veriff - Verify Outcome] Verification needs resubmission');
    }
    case 'expired': {
      logger.info({ verificationId }, '[Veriff - Verify Outcome] Verification expired');
    }
    case 'abandoned': {
      logger.info({ verificationId }, '[Veriff - Verify Outcome] Verification abandoned');
    }
    default: {}
  }

  // Update the order tags
  try {
    const shopify = await connections.shopify.forShopId(shopId);
    if (!shopify) {
      throw new Error("[Veriff - Verify Outcome] Missing Shopify connection");
    }

    const result = await shopify.graphql(
      `mutation ($id: ID!, $tags: [String!]!) {
        tagsAdd(id: $id, tags: $tags) {
          node {
            id
          }
          userErrors {
            message
          }
        }
      }`,
      {
        id: `gid://shopify/Order/${order.id}`,
        tags: ["Verifly Verified"]
      }
    );

    logger.info({ result }, '[Veriff - Verify Outcome] Order tags updated successfully');

  } catch (error) {
    logger.error({ error, orderId: order.id }, '[Veriff - Verify Outcome] Order tags update failed');
    return reply.code(500).send({error: `Order tags update failed: ${error.message}`});
  }
}

export default route;

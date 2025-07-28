import { RouteHandler } from "gadget-server";

import { isSignatureValid } from '../../helpers/veriff';

/**
 * Route handler for stripe webhook
 *
 * @type { RouteHandler } route handler - see: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = async ({ request, reply, api, logger, connections }) => {
  let verificationId;

  // Verify the event came from Stripe
  try {
    const signature = request.headers['x-hmac-signature'];
    const secret = process.env.VERIFF_SECRET_KEY;
    const payload = request.body;

    if (!isSignatureValid({ signature, secret, payload })) {
      logger.error('[Veriff - Verify Outcome] Invalid signature');
      return reply.code(400).send({ error: 'Invalid signature' });
    }

    const { data } = payload;
    const { verification } = data;
    verificationId = verification.vendorData;

    logger.info({ verificationId }, `[Veriff - Verify Outcome] Incoming verification decision`);
  } catch (error) {
    // On error, log and return the error message
    logger.error(`Veriff verification decision receipt failed: ${error.message}`);
    return reply.code(400).send({error: `Veriff verification decision receipt failed: ${error.message}`});
  }

  // First look for an existing verification record with this session ID
  const internalVerification = await api.verification.findOne(verificationId);
  const customer = await api.shopifyCustomer.findOne(internalVerification.customerId);
  const order = await api.shopifyOrder.findOne(internalVerification.orderId);
  const shopId = internalVerification.shopId;

  switch (verification.decision) {
    case 'approved': {
      logger.info({ verificationId }, `[Veriff - Verify Outcome] Verification approved, updating internal verification`);

      try {
        await api.verification.update(internalVerification.id, {
          status: 'approved',
        });

        logger.info({ verificationId }, `[Veriff - Verify Outcome] Internal verification updated`);
      } catch (error) {
        logger.error({ verificationId }, `[Veriff - Verify Outcome] Unable to update internal verification`);
        return reply.code(500).send({error: `Unable to update internal verification: ${error.message}`});
      }

      try {
        await api.shopifyCustomer.update(customer.id, {
          status: "approved"
        });
        logger.info({ customerId }, `[Veriff - Verify Outcome] Customer status updated`);
      } catch (error) {
        logger.error({ customerId }, `[Veriff - Verify Outcome] Unable to update customer status`);
        return reply.code(500).send({error: `Unable to update customer status: ${error.message}`});
      }

      break;
    }
    
    case 'declined': {
      logger.info({ verificationId }, `[Veriff - Verify Outcome] Verification denied, updating internal verification`);

      try {
        await api.verification.update(internalVerification.id, {
          status: 'denied',
        });

        logger.info({ verificationId }, `[Veriff - Verify Outcome] Internal verification updated`);
      } catch (error) {
        logger.error({ verificationId }, `[Veriff - Verify Outcome] Unable to update internal verification`);
        return reply.code(500).send({error: `Unable to update internal verification: ${error.message}`});
      }

      try {
        await api.shopifyCustomer.update(customer.id, {
          status: "denied"
        });
        logger.info({ customerId }, `[Veriff - Verify Outcome] Customer status updated`);
      } catch (error) {
        logger.error({ customerId }, `[Veriff - Verify Outcome] Unable to update customer status`);
        return reply.code(500).send({error: `Unable to update customer status: ${error.message}`});
      }

      break;
    }
    
    case 'resubmission_request': {
      logger.info({ verificationId }, `[Veriff - Verify Outcome] Verification needs resubmission, updating internal verification`);

      try {
        await api.verification.update(internalVerification.id, {
          status: 'resubmit',
        });

        logger.info({ verificationId }, `[Veriff - Verify Outcome] Internal verification updated`);
      } catch (error) {
        logger.error({ verificationId }, `[Veriff - Verify Outcome] Unable to update internal verification`);
        return reply.code(500).send({error: `Unable to update internal verification: ${error.message}`});
      }

      try {
        await api.shopifyCustomer.update(customer.id, {
          status: "resubmit"
        });
        logger.info({ customerId }, `[Veriff - Verify Outcome] Customer status updated`);
      } catch (error) {
        logger.error({ customerId }, `[Veriff - Verify Outcome] Unable to update customer status`);
        return reply.code(500).send({error: `Unable to update customer status: ${error.message}`});
      }

      break;
    }
    
    case 'expired': {
      logger.info({ verificationId }, `[Veriff - Verify Outcome] Verification expired, updating internal verification`);

      try {
        await api.verification.update(internalVerification.id, {
          status: 'expired',
        });

        logger.info({ verificationId }, `[Veriff - Verify Outcome] Internal verification updated`);
      } catch (error) {
        logger.error({ verificationId }, `[Veriff - Verify Outcome] Unable to update internal verification`);
        return reply.code(500).send({error: `Unable to update internal verification: ${error.message}`});
      }

      try {
        await api.shopifyCustomer.update(customer.id, {
          status: "expired"
        });
        logger.info({ customerId }, `[Veriff - Verify Outcome] Customer status updated`);
      } catch (error) {
        logger.error({ customerId }, `[Veriff - Verify Outcome] Unable to update customer status`);
        return reply.code(500).send({error: `Unable to update customer status: ${error.message}`});
      }

      break;
    }

    case 'abandoned': {
      logger.info({ verificationId }, `[Veriff - Verify Outcome] Verification abandoned, updating internal verification`);

      try {
        await api.verification.update(internalVerification.id, {
          status: 'abandoned',
        });

        logger.info({ verificationId }, `[Veriff - Verify Outcome] Internal verification updated`);
      } catch (error) {
        logger.error({ verificationId }, `[Veriff - Verify Outcome] Unable to update internal verification`);
        return reply.code(500).send({error: `Unable to update internal verification: ${error.message}`});
      }

      try {
        await api.shopifyCustomer.update(customer.id, {
          status: "abandoned"
        });
        logger.info({ customerId }, `[Veriff - Verify Outcome] Customer status updated`);
      } catch (error) {
        logger.error({ customerId }, `[Veriff - Verify Outcome] Unable to update customer status`);
        return reply.code(500).send({error: `Unable to update customer status: ${error.message}`});
      }

      break;
    }

    default: {
      logger.info({ verificationId }, `[Veriff - Verify Outcome] Unhandled decision code: ${verification.code}`);
    }
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

import { RouteHandler } from "gadget-server";
import Stripe from 'stripe';

/**
 * Route handler for stripe webhook
 *
 * @type { RouteHandler } route handler - see: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = async ({ request, reply, api, logger, connections }) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let event;
  let verificationSession;

  let customerId, shopId, orderId;

  // Verify the event came from Stripe
  try {
    const signature = request.headers['stripe-signature'];
    
    event = stripe.webhooks.constructEvent(
      request.body, 
      signature, 
      process.env.STRIPE_WEBHOOK_SECRET
    );

    verificationSession = event.data.object;
    
    shopId = verificationSession.metadata.shop_id;
    customerId = parseFloat(verificationSession.metadata.customer_id);
    orderId = verificationSession.metadata.order_id;

    logger.info({ customerId }, `Verifying customer`);
  } catch (error) {
    // On error, log and return the error message
    logger.error(`Stripe verification event construction error: ${error.message}`);
    return reply.code(400).send({error: `Stripe verification event construction error: ${error.message}`});
  }

  try {
    // First look for an existing verification record with this session ID
    const existingVerification = await api.verification.maybeFindFirst({
      filter: {
        sessionId: { equals: verificationSession.id }
      }
    });

    const verificationData = {
      sessionId: verificationSession.id,
      status: verificationSession.status,
      shop: {
        _link: shopId
      },
      customer: {
        _link: customerId
      },
      order: {
        _link: orderId
      }
    };

    let result;
    if (existingVerification) {
      // If record exists, update it
      result = await api.verification.update(existingVerification.id, verificationData);
      logger.info({ verificationId: existingVerification.id, shopId, customerId, orderId }, `Updated existing verification record`);
    } else {
      // If no record exists, create a new one
      result = await api.verification.create(verificationData);
      logger.info({ verificationId: result.id, shopId, customerId, orderId }, `Created new verification record`);
    }

    logger.info({ result, shopId, customerId, orderId }, `Verification record processed`);
  } catch (error) {
    logger.error(`DB error: ${error.message}`);
    return reply.code(500).send({error: `DB error: ${error.message}`});
  }

  try {
    const shopify = await connections.shopify.forShopId(shopId);
    if (!shopify) {
      throw new Error("[VerificationOutcome - Verified] Missing Shopify connection");
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
        id: `gid://shopify/Order/${orderId}`,
        tags: ["Verifly Verified"]
      }
    );

    logger.info({ result }, '[VerificationOutcome - Verified] Order tags updated successfully');

  } catch (error) {
    logger.error({ error, orderId }, '[VerificationOutcome - Verified] Order tags update failed');
    return reply.code(500).send({error: `Order tags update failed: ${error.message}`});
  }

  // Successfully constructed event
  switch (event.type) {
    // Success
    case 'identity.verification_session.verified': {
      logger.info({ customerId }, `[VerificationOutcome - Verified] Stripe verified customer`);

      const customer = await api.shopifyCustomer.maybeFindFirst({
        filter: {
          platformCustomerId: { equals: customerId }
        }
      });

      logger.info({ customer }, `[VerificationOutcome - Verified] DB located customer from Stripe verification session`);

      if (!customer) {
        logger.error({ customerId }, `[VerificationOutcome - Verified] No customer found`);
        return reply.code(404).send(`Customer not found: ${customerId}`);
      }

      try {
        // All the verification checks passed
        await api.shopifyCustomer.update(customer.id, {
          status: "verified"
        });

        logger.info({ customerId }, `[VerificationOutcome - Verified] Customer status updated successfully`);
        return reply.code(200).send({ success: true });
      } catch (error) {
        logger.error({ customerId }, `[VerificationOutcome - Verified] unable to update customer as 'verified'`);
        return reply.code(500).send(`Verification status update to 'verified' failed for customer ${customerId}`);
      }
    }

    // Further action required
    case 'identity.verification_session.requires_input': {
      logger.info({ customerId }, `[VerificationOutcome - Input Required] Stripe requests further action to verify`);

      const customer = await api.shopifyCustomer.maybeFindFirst({
        filter: {
          platformCustomerId: { equals: customerId }
        }
      });

      logger.info({ customer }, `[VerificationOutcome - Input Required] DB located customer from Stripe verification session`);

      if (!customer) {
        logger.error({ customerId }, `[VerificationOutcome - Input Required] No customer found`);
        return reply.code(404).send(`Customer not found: ${customerId}`);
      }

      try {
        await api.shopifyCustomer.update(customer.id, {
          status: "pending"
        });

        logger.info({ customerId }, `[VerificationOutcome - Input Required] Customer status updated successfully`);
        return reply.code(200).send({ success: true });
      } catch (error) {
        logger.error({ customerId }, `[VerificationOutcome - Input Required] Unable to update customer verification as 'pending'`);
        return reply.code(500).send(`Verification status update to 'pending' failed for customer ${customerId}`);
      }
    }
        
    default:
      logger.info(`Unhandled event type: ${event.type}`);
      return reply.code(200).send({ received: true });
  }
}

export default route;

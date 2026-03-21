import { RouteHandler } from "gadget-server";

import { isSignatureValid } from '../../helpers/veriff';

/**
 * Helper function to return a new object where every value
 * in the input object is upper-cased (if it is a string).
 * @param {Object} obj
 * @returns {Object}
 */
function upperCaseAddressComponents(obj = {}) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      typeof value === "string" ? value.toUpperCase() : value,
    ])
  );
}

/**
 * Route handler for Veriff webhook
 *
 * @type { RouteHandler } route handler - see: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = async ({ request, reply, api, logger, connections }) => {
  let verificationId, verification;

  // Verify the event came from Veriff
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

    // The user might take awhile to complete the checkout, so we need to postpone processing
    if (vendorData.includes('@')) {
      await api.enqueue(
        api.processPreCheckoutVerification,
        {
          veriffWebhookPayload: payload
        },
        {
          startAt: new Date(Date.now() + 1000 * 60 * 15).toISOString(), // Starts in 15 minutes
        }
      );

      return reply.code(200).send({ message: 'Pre-checkout verification decision processing scheduled' });
    } else {
      verificationId = vendorData;
    }

    logger.info({ verificationId }, `[Veriff - Verify Outcome] Incoming verification decision`);
  } catch (error) {
    // On error, log and return the error message
    logger.error(`Veriff verification decision receipt failed: ${error.message}`);
    return reply.code(400).send({error: `Veriff verification decision receipt failed: ${error.message}`});
  }

  // First look for an existing verification record with this session ID
  const internalVerification = await api.verification.findById(verificationId);

  const shopId = internalVerification.shopId;
  let customer, order;
  
  // Test verifications don't have a customer or order, so we don't need to update them
  if (!internalVerification.test) {
    customer = await api.shopifyCustomer.findFirst({
      filter: {
        platformCustomerId: {
          equals: parseFloat(internalVerification.customerId)
        }
      }
    });

    order = await api.shopifyOrder.findById(internalVerification.orderId);

    try {
      await api.shopifyCustomer.update(customer.id, {
        status: verification.decision
      });
      logger.info({ customerId: customer.platformCustomerId }, `[Veriff - Verify Outcome] Customer status updated`);
    } catch (error) {
      logger.error({ customerId: customer.platformCustomerId }, `[Veriff - Verify Outcome] Unable to update customer status`);
      return reply.code(500).send({error: `Unable to update customer status: ${error.message}`});
    }
  }

  try {
    await api.verification.update(internalVerification.id, {
      status: verification.decision,
    });

    logger.info({ verificationId }, `[Veriff - Verify Outcome] Internal verification updated`);
  } catch (error) {
    logger.error({ verificationId }, `[Veriff - Verify Outcome] Unable to update internal verification`);
    return reply.code(500).send({error: `Unable to update internal verification: ${error.message}`});
  }

  logger.info({ verificationId }, `[Veriff - Verify Outcome] Verification ${verification.decision}`);

  // Update the order tags if it's not a test verification
  if (!internalVerification.test) {
    try {
      const shopify = await connections.shopify.forShopId(shopId);
      if (!shopify) {
        throw new Error("[Veriff - Verify Outcome] Missing Shopify connection");
      }

      const shop = await api.shopifyShop.findById(shopId);
      let tags = ["Verifly Verified"];

      if (shop?.enforceShippingAddressMatch) {
        const shippingAddress = upperCaseAddressComponents(order?.shippingAddress); // Gadget doesn't uppercase
        const documentAddress = upperCaseAddressComponents(verification?.person?.address?.components); // In case Veriff doesn't uppercase in the future

        const shippingAndDocumentAddressesMatch =
          `${documentAddress?.houseNumber} ${documentAddress?.road}` === shippingAddress?.address1 &&
          documentAddress?.unit === shippingAddress?.address2 &&
          documentAddress?.city === shippingAddress?.city &&
          documentAddress?.state === shippingAddress?.province_code &&
          documentAddress?.postcode === shippingAddress?.zip;

        if (!shippingAndDocumentAddressesMatch) {
          tags = ["Verifly Address Mismatch"];
        }
      }

      if (shop?.preVerificationOrderTag && shop?.preVerificationOrderTag.length > 0) {
        const removeResult = await shopify.graphql(
          `mutation ($id: ID!, $tags: [String!]!) {
            tagsRemove(id: $id, tags: $tags) {
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
            tags: [shop.preVerificationOrderTag]
          }
        );

        if (removeResult?.tagsRemove?.userErrors?.length) {
          logger.error(
            { userErrors: removeResult.tagsRemove.userErrors, orderId: order.id },
            '[Veriff - Verify Outcome] tagsRemove userErrors'
          );
          throw new Error(removeResult.tagsRemove.userErrors[0].message);
        }
      }

      const addResult = await shopify.graphql(
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
          tags: tags
        }
      );

      if (addResult?.tagsAdd?.userErrors?.length) {
        logger.error(
          { userErrors: addResult.tagsAdd.userErrors, orderId: order.id },
          '[Veriff - Verify Outcome] tagsAdd userErrors'
        );
        throw new Error(addResult.tagsAdd.userErrors[0].message);
      }

      logger.info({ addResult }, '[Veriff - Verify Outcome] Order tags updated successfully');

    } catch (error) {
      logger.error({ error, orderId: order.id }, '[Veriff - Verify Outcome] Order tags update failed');
      return reply.code(500).send({error: `Order tags update failed: ${error.message}`});
    }
  }
}

export default route;

/** @type { ActionRun } */
export const run = async ({ params, trigger, logger, api, connections }) => {
  const { veriffWebhookPayload } = params;

  if (!veriffWebhookPayload) {
    throw new Error("[Process Pre-Checkout Verification] - Missing required Veriff webhook payload");
  }

  const { vendorData, sessionId, data } = veriffWebhookPayload;
  const verification = data.verification;
  let order;

  logger.info({ sessionId }, '[Process Pre-Checkout Verification] Processing verification');

  try {
    // Retrieve the customer and order to inform the rest of the flow
    const customer = await api.shopifyCustomer.findFirst({
      filter: {
        email: {
          equals: vendorData
        }
      },
      sort: { createdAt: "Descending" }
    });

    logger.info({ customerId: customer.id }, '[Process Pre-Checkout Verification] Found customer');

    order = await api.shopifyOrder.findFirst({
      filter: {
        customerId: {
          equals: customer.id
        },
        shopId: {
          equals: customer.shopId
        }
      },
      sort: { createdAt: "Descending" }
    });

    logger.info({ orderId: order.id }, '[Process Pre-Checkout Verification] Found order');

    // Create the verification since it wasn't created from the 'orders/create' webhook
    const internalVerification = await api.verification.create({
      sessionId,
      status: verification.decision,
      shop: {
        _link: customer.shopId
      },
      customer: {
        _link: customer.id
      },
      order: {
        _link: order.id
      }
    });

    logger.info({ verificationId: internalVerification.id }, '[Process Pre-Checkout Verification] Created verification');

    // Update the customer status to the verification decision
    await api.shopifyCustomer.update(customer.id, {
      status: verification.decision
    });

    logger.info({ customerId: customer.platformCustomerId }, `[Process Pre-Checkout Verification] Customer status updated`);

    logger.info({ verificationId }, `[Process Pre-Checkout Verification] Verification ${verification.decision}`);
  } catch (error) {
    logger.error({ sessionId, error }, "[Process Pre-Checkout Verification] Error processing verification");
  }

  // Update the order tags
  try {
    const shopify = await connections.shopify.forShopId(customer.shopId);
    if (!shopify) {
      throw new Error("[Process Pre-Checkout Verification] Missing Shopify connection");
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

    logger.info({ result }, '[Process Pre-Checkout Verification] Order tags updated successfully');

  } catch (error) {
    logger.error({ error, orderId: order.id }, '[Process Pre-Checkout Verification] Order tags update failed');
  }
};

export const options = {
  triggers: {
    api: true
  },
};

export const params = {
  veriffWebhookPayload: {
    type: "object",
    additionalProperties: true
  },
};

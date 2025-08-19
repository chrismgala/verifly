import { RouteHandler } from "gadget-server";

import { createUserToken } from "../../../../helpers/util";

/**
 * Route handler for theme extension proxy calls.
 *
 * @type { RouteHandler } route handler - see: https://docs.gadget.dev/guides/http-routes/route-context
 */
const route = async ({ request, reply, api, logger, connections }) => {
  const { shopId, email } = request.params;

  logger.info({ email }, "Checking verification status");

  try {
    const customer = await api.shopifyCustomer.maybeFindFirst({
      filter: {
        email: {
          equals: email
        },
        shopId: {
          equals: shopId
        }
      }
    });

    const userToken = createUserToken(shopId, email);

    if (customer) {
      logger.info({ customerId: customer.id }, "[Proxy] Verification status retrieved");
      return reply.code(200).send({ status: customer.status, userToken });

    } else {
      await api.shopifyCustomer.create({
        email,
        // Reference the shop using _link syntax
        shop: {
          _link: shopId // This is the ID of the shopifyShop where shopifyShop is the parent record
        }
      });

      logger.info({ email }, "[Proxy] No customer found, created new customer for post-verification updates");
      return reply.code(200).send({ status: 'unverified', userToken });
    }
  } catch (error) {
    logger.error({ email, error }, "[Proxy] Error checking verification status");
    return reply.code(500).send(error);
  }
};

route.options = {
  schema: {
    params: {
      type: "object",
      properties: {
        email: { type: "string" },
      },
      required: ["email"],
    }
  }
};

export default route;
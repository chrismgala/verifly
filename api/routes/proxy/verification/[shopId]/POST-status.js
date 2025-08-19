import { RouteHandler } from "gadget-server";
import jwt from "jsonwebtoken";

/**
 * Route handler for theme extension proxy calls.
 *
 * @type { RouteHandler } route handler - see: https://docs.gadget.dev/guides/http-routes/route-context
 */
const route = async ({ request, reply, api, logger, connections }) => {
  const { shopId } = request.params;
  const { userToken } = request.body;

  logger.info({ shopId }, "Decoding verified user token");

  const decoded = jwt.verify(userToken, process.env.JWT_SECRET);

  if (decoded.shopId !== shopId) {
    logger.error({ shopId, decoded }, "[Proxy] Invalid shop ID");
    return reply.code(400).send({ error: "Invalid shop ID" });
  }

  try {
    const customer = await api.shopifyCustomer.maybeFindFirst({
      filter: {
        email: {
          equals: decoded.email
        },
        shopId: {
          equals: decoded.shopId
        }
      }
    });

    if (customer.status === 'approved') {
      logger.info({ shopId, email: customer.email }, "[Proxy] Confirmed user is verified");
      return reply.code(200).send({ status: customer.status });
    } else {
      logger.info({ shopId, email: customer.email }, "[Proxy] User is not verified");
      return reply.code(200).send({ status: 'unverified' });
    }
  } catch (error) {
    logger.error({ shopId, error }, "[Proxy] Could not find user from decoded metadata");
    return reply.code(500).send(error);
  }
};

route.options = {
  schema: {
    body: {
      type: "object",
      properties: {
        userToken: { type: "string" },
      },
      required: ["userToken"],
    }
  }
};

export default route;
import { RouteHandler } from "gadget-server";

/**
 * Route handler for order verifications
 *
 * @type { RouteHandler } route handler - see: https://docs.gadget.dev/guides/http-routes/route-context
 */
const route = async ({ request, reply, api, logger, connections }) => {
  const { id, sessionId } = request.params;
  const { override } = request.body;

  logger.debug({ id, sessionId }, "Overriding verification");

  if (override) {
    // Update verification status internally
    try {
      await api.verification.update(id, {
        status: 'approved'
      });
    } catch (error) {
      logger.error({ 
        error, 
        shopId: request.params.id, 
        sessionId: request.params.sessionId 
      }, "Failed to update verification status");

      return reply.code(500).send({ error: "Failed to update verification status" });
    }

    return reply.code(200).send({ message: "Verification overridden" });
  } else {
    return reply.code(200).send({ message: "Verification not overridden" });
  }
}

export default route;
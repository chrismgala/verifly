import { RouteHandler } from "gadget-server";
import { Resend } from "resend";

/**
 * Route handler for domain verification in Resend
 *
 * @type { RouteHandler } route handler - see: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = async ({ request, reply, api, logger, connections }) => {
  try {
    const domainId = request.params.domainId;

    logger.info({ domainId }, 'Verifying domain in Resend');

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.domains.verify(domainId);

    if (error) {
      logger.error({ error }, "Error verifying domain in Resend");
      return reply.code(500).send({ error: "Failed to verify domain in Resend" });
    }

    await reply.code(200).send();

  } catch (error) {
    logger.error(`Error verifying domain in Resend: ${error.message}`, { error });
    
    await reply.code(500).send({
      error: "Failed to verify domain in Resend",
      message: error.message,
    });
  }
};

// Set route options including body schema validation
route.options = {
  schema: {
    body: {
      type: "object",
      properties: {
        domainId: { type: "string" },
      },
      required: ["domainId"],
    },
  },
};

export default route;
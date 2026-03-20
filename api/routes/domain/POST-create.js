import { RouteHandler } from "gadget-server";
import { Resend } from "resend";

/**
 * Route handler for domain creation in Resend
 *
 * @type { RouteHandler } route handler - see: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = async ({ request, reply, api, logger, connections }) => {
  try {
    const { domain, shopId } = request.body;

    logger.info({ shopId, domain }, 'Creating custom domain in Resend');

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.domains.create({ name: domain });

    if (error) {
      logger.error({ error }, "Error creating custom domain in Resend");
      return reply.code(500).send({ error: "Failed to create custom domain in Resend" });
    }

    logger.info({ domain: data?.name }, "Custom domain created successfully");

    await api.shopifyShop.update(shopId, {
      domainId: data?.id,
    });

    await reply.code(200).send({
      domain: data?.name,
      domainId: data?.id,
      domainRecords: data?.records,
      status: data?.status,
    });

  } catch (error) {
    logger.error(`Error creating custom domain in Resend: ${error.message}`, { error });
    
    await reply.code(500).send({
      error: "Failed to create custom domain in Resend",
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
        domain: { type: "string" },
        shopId: { type: "string" },
      },
      required: ["domain", "shopId"],
    },
  },
};

export default route;
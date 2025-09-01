import { RouteHandler } from "gadget-server";
import { Resend } from "resend";

/**
 * Route handler for domain creation in Resend
 *
 * @type { RouteHandler } route handler - see: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = async ({ request, reply, api, logger, connections }) => {
  try {
    const shopId = request.params.shopId;
    const { domain } = request.body;

    logger.info({ shopId, domain }, 'Creating custom domain in Resend');

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.domains.create({ name: domain });

    if (error) {
      logger.error({ error }, "Error creating custom domain in Resend");
      return reply.code(500).send({ error: "Failed to create custom domain in Resend" });
    }

    logger.info({ domain: data?.name }, "Custom domain created successfully");

    let records = {};
    for (let i = 0; i < data?.records.length; i++) {
      records[i] = data?.records[i];
    }

    await api.shopifyShop.update(shopId, {
      domainRecords: records,
      domainId: data?.id,
    });

    await reply.code(200).send({
      domain: data?.name,
      domainRecords: records,
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
    params: {
      type: "object",
      properties: {
        shopId: { type: "string" },
      },
      required: ["shopId"],
    },
    body: {
      type: "object",
      properties: {
        domain: { type: "string" },
      },
      required: ["domain"],
    },
  },
};

export default route;
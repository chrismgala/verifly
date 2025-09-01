import { RouteHandler } from "gadget-server";
import { Resend } from "resend";

import { createVerificationSession } from "../../helpers/veriff";
import VerificationEmail from "../../../web/components/VerificationEmail/VerificationEmail";

/**
 * Route handler for test verification emails
 *
 * @type { RouteHandler } route handler - see: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = async ({ request, reply, api, logger, connections }) => {
  try {
    const shopId = request.params.shopId;
    const { testEmail } = request.body;

    logger.info({ shopId }, 'Processing test verification');

    // Find the shop by ID
    const shop = await api.shopifyShop.findOne(shopId, {
      select: {
        id: true,
        name: true,
        domain: true,
        testVerificationSent: true,
        shopOwner: true
      }
    });

    if (!shop) {
      await reply.code(404).send({ error: "Shop not found" });
      return;
    }

    if (shop.testVerificationSent) {
      await reply.code(400).send({ error: "Test verification already sent" });
      return;
    }

    const veriffVerification = await createVerificationSession({
      verification: {}
    });

    const { verification } = veriffVerification;
    const { url } = verification;

    logger.info({ sessionId: verification.id }, 'Created Veriff verification session');

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: 'Verifly <info@verifly.shop>',
      to: testEmail,
      subject: `[Test] Verify your identity`,
      react: VerificationEmail({
        shopName: shop.name,
        customerName: shop.shopOwner,
        orderNumber: '#12345',
        url,
        test: true
      })
    });

    if (error) {
      logger.error({ error }, "Error sending test verification email");
      return reply.code(500).send({ error: "Failed to send test verification email" });
    }

    logger.info({ emailId: data?.id }, "Test verification email sent successfully");

    // Update shop's testVerificationSent field to true
    await api.shopifyShop.update(shopId, {
      testVerificationSent: true,
    });

    logger.info({ shopId }, 'Shop test verification limit reached');

    await api.verification.create({
      sessionId: verification.id,
      status: 'pending',
      shop: {
        _link: shopId,
      },
      emailId: data?.id,
      test: true,
    });

    await reply.send({
      success: true,
      message: "Test verification sent successfully",
      sessionId: verification.id,
    });

  } catch (error) {
    logger.error(`Error sending or creating test verification: ${error.message}`, { error });
    
    await reply.code(500).send({
      error: "Failed to send test verification",
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
        testEmail: { type: "string", format: "email" },
      },
      required: ["testEmail"],
    },
  },
};

export default route;
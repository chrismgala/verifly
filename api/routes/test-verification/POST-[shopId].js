import { RouteHandler } from "gadget-server";
import Stripe from "stripe";
import { Resend } from "resend";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Route handler for order verifications
 *
 * @type { RouteHandler } route handler - see: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = async ({ request, reply, api, logger, connections }) => {
  try {
    const shopId = request.params.shopId;
    const { testEmail } = request.body;

    if (!testEmail) {
      await reply.code(400).send({ error: "Test email is required in request body" });
      return;
    }

    logger.info(`Processing test verification for shopId: ${shopId}, email: ${testEmail}`);

    // Find the shop by ID
    const shop = await api.shopifyShop.findOne(shopId, {
      select: {
        id: true,
        name: true,
        domain: true,
        testVerificationSent: true
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

    // Create Stripe identity verification session
    const stripeVerificationSession = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        shop_id: shopId,
        test_verification: 'true',
        customer_email: testEmail
      },
    });

    logger.info(`Created Stripe verification session: ${stripeVerificationSession.id}`);

    // Send email using Resend
    const stripeVerificationUrl = stripeVerificationSession.url;
    
    const emailSubject = `Test Verification - ${shop.name}`;
    const emailContent = `
      <h2>Test Identity Verification</h2>
      <p>This is a test verification for your Verifly setup.</p>
      
      <p>Please complete your identity verification by clicking the link below:</p>
      
      <a href="${stripeVerificationUrl}" target="_blank">Verify Now</a>
      
      <p>
        This is a test verification sent from ${shop.name} using Verifly.
      </p>
    `;

    await resend.emails.send({
      from: "Verifly <info@verifly.shop>",
      to: testEmail,
      subject: emailSubject,
      html: emailContent,
    });

    logger.info(`Sent test verification email to: ${testEmail}`);

    // Update shop's testVerificationSent field to true
    await api.shopifyShop.update(shopId, {
      testVerificationSent: true,
    });

    logger.info(`Updated shop ${shopId} testVerificationSent to true`);

    await reply.send({
      success: true,
      message: "Test verification sent successfully",
      sessionId: stripeVerificationSession.id,
    });

  } catch (error) {
    logger.error(`Error sending test verification: ${error.message}`, { error });
    
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
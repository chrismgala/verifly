import { RouteHandler } from "gadget-server";
import Stripe from "stripe";
import { Resend } from "resend";

/**
 * Route handler for order verifications
 *
 * @type { RouteHandler } route handler - see: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = async ({ request, reply, api, logger, connections }) => {
  try {
    const shopId = request.params.shopId;
    const { verificationId, verificationSessionId } = request.body;

    if (!verificationSessionId) {
      await reply.code(400).send({ error: "Verification session ID is required in request body" });
      return;
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const stripeVerificationSession = await stripe.identity.verificationSessions.retrieve(
      verificationSessionId
    );

    logger.info({ stripeVerificationSession }, "Stripe verification session retrieved");

    // Find the shop by ID
    const shop = await api.shopifyShop.findOne(shopId, {
      select: {
        name: true
      }
    });

    const { metadata } = stripeVerificationSession;
    const { customer_id, order_id } = metadata;

    const customer = await api.shopifyCustomer.findFirst({
      filter: {
        platformCustomerId: {
          equals: parseFloat(customer_id)
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });

    const order = await api.shopifyOrder.findOne(order_id, {
      select: {
        name: true
      }
    });

    const orderNumber = order.name;

    const shopName = shop.name;

    const customerFirstName = customer.firstName || '';
    const customerLastName = customer.lastName || '';
    const customerName = customerFirstName ?
      `${customerFirstName} ${customerLastName}`.trim() :
      'Customer';
    const customerEmail = customer.email;

    // Send email using Resend
    const stripeVerificationUrl = stripeVerificationSession.url;

    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const { data, error } = await resend.emails.send({
      from: 'Verifly <info@verifly.shop>',
      to: customerEmail,
      subject: `[Action required] Complete verification to avoid delays in shipping your ${shopName} order`,
      html: `
        <h2>Please Verify Yourself With ${shopName}</h2>
        
        <p>Hey there ${customerName},</p>
        
        <p>
          Your Order ${orderNumber} for ${shopName} has been received. However, ID verification is required to approve fulfillment of your order.
        </p>
        
        <p>Please click below to verify your information:</p>

        <a href="${stripeVerificationUrl}" target="_blank">Verify Now</a>
      `
    });

    // Log
    logger.info({ customer }, "Verification email resent");

    await reply.code(200).send({
      message: "Verification email resent successfully",
    });

  } catch (error) {
    logger.error(`Error resending verification email: ${error.message}`, { error });
    
    await reply.code(500).send({
      error: "Failed to resend verification email",
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
        verificationId: { type: "string" },
        verificationSessionId: { type: "string" },
      },
      required: ["verificationId", "verificationSessionId"],
    },
  },
};

export default route;
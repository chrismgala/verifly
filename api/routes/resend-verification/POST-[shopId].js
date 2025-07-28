import { RouteHandler } from "gadget-server";
import { Resend } from "resend";

import { createVerificationSession } from "../../helpers/veriff";
import VerificationEmail from "../../../web/components/VerificationEmail/VerificationEmail";

/**
 * Route handler for order verifications
 *
 * @type { RouteHandler } route handler - see: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = async ({ request, reply, api, logger, connections }) => {
  try {
    const shopId = request.params.shopId;
    const { verificationId, verificationSessionId } = request.body;

    const internalVerification = await api.verification.maybeFindOne(verificationId);

    if (!internalVerification || internalVerification.sessionId !== verificationSessionId) {
      logger.error({ 
        error: "Verification does not exist", 
        verificationId: verificationId, 
        sessionId: verificationSessionId 
      }, "Verification does not exist");

      return reply.code(404).send({ error: "Verification does not exist" });
    }

    const newInternalVerification = await api.verification.create({
      status: 'pending',
      shop: {
        _link: shopId
      },
      customer: {
        _link: internalVerification.customerId
      },
      order: {
        _link: internalVerification.orderId
      }
    });

    logger.info({ newInternalVerification }, "Created new verification record");

    const shop = await api.shopifyShop.findOne(shopId, {
      select: {
        name: true
      }
    });

    const customer = await api.shopifyCustomer.findFirst({
      filter: {
        platformCustomerId: {
          equals: parseFloat(internalVerification.customerId)
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });

    const order = await api.shopifyOrder.findOne(internalVerification.orderId, {
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

    const veriffVerification = await createVerificationSession({
      verification: {
        person: {
          firstName: customerFirstName,
          lastName: customerLastName,
          email: customerEmail,
        },
        vendorData: newInternalVerification.id
      },
    });

    const { verification } = veriffVerification;
    const { url } = verification;

    // Send email using Resend

    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const { data, error } = await resend.emails.send({
      from: 'Verifly <info@verifly.shop>',
      to: customerEmail,
      subject: `[Action required] Verify your identity`,
      react: VerificationEmail({
        shopName,
        customerName,
        orderNumber,
        url
      })
    });

    if (error) {
      logger.error({ error }, "Error sending verification email");
      return;
    }

    logger.info({ emailId: data?.id }, "Verification email sent successfully");

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
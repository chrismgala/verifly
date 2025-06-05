import { RouteHandler } from "gadget-server";
import Stripe from 'stripe';

/**
 * Route handler for order verifications
 *
 * @type { RouteHandler } route handler - see: https://docs.gadget.dev/guides/http-routes/route-context
 */
const route = async ({ request, reply, api, logger, connections }) => {
  const { id, sessionId } = request.params;
  logger.debug({ id, sessionId }, "Retrieving verification from DB");

  const verification = await api.verification.findOne(id, {
    filter: {
      sessionId: {
        equals: sessionId
      }
    }
  });

  try {
    const stripe = new Stripe(process.env.STRIPE_RESTRICTED_KEY);
    const stripeVerificationSession = await stripe.identity.verificationSessions.retrieve(
      verification.sessionId,
      {
        expand: [
          'verified_outputs',
          'last_verification_report',
        ],
      }
    );

    // Retrieve the File id
    const report = stripeVerificationSession.last_verification_report;
    const documentFrontFile = report.document.files[0];
    const documentBackFile = report.document.files[1];

    // Create a short-lived FileLinks
    const fileLinkFront = await stripe.fileLinks.create({
      file: documentFrontFile,
      expires_at: Math.floor(Date.now() / 1000) + 30,  // link expires in 30 seconds
    });

    const fileLinkBack = await stripe.fileLinks.create({
      file: documentBackFile,
      expires_at: Math.floor(Date.now() / 1000) + 30,  // link expires in 30 seconds
    });

    // Access the FileLink URL to download file contents
    const fileUrlFront = fileLinkFront.url;
    const fileUrlBack = fileLinkBack.url;

    const { created, last_verification_report } = stripeVerificationSession;

    return reply.code(200).send({
      lastVerificationReport: last_verification_report,
      files: [fileUrlFront, fileUrlBack]
     });
  } catch (error) {
    logger.error({ 
      error, 
      shopId: request.params.id, 
      sessionId: request.params.sessionId 
    }, "Failed to retrieve single verification from Stripe");

    return reply.code(500).send({ error: "Failed to retrieve single verification from Stripe" });
  }
}

export default route;
import { RouteHandler } from "gadget-server";

import { getSessionMedia, getSessionDecision, getSessionImage } from "../../../helpers/veriff";

/**
 * Route handler for order verifications
 *
 * @type { RouteHandler } route handler - see: https://docs.gadget.dev/guides/http-routes/route-context
 */
const route = async ({ request, reply, api, logger, connections }) => {
  const { id, sessionId } = request.params;

  const internalVerification = await api.verification.maybeFindOne(id);

  if (!internalVerification || internalVerification.sessionId !== sessionId) {
    logger.error({ 
      error: "Verification does not exist", 
      verificationId: id, 
      sessionId: sessionId 
    }, "Verification does not exist");

    return reply.code(404).send({ error: "Verification does not exist" });
  }

  try {
    const veriffSessionMedia = await getSessionMedia(internalVerification.sessionId);
    const veriffSessionDecision = await getSessionDecision(internalVerification.sessionId);

    const { images } = veriffSessionMedia;
    const { verification } = veriffSessionDecision;
    const { acceptanceTime, person, document } = verification;

    let rawImages = [];

    for (const image of images) {
      const rawImageBuffer = await getSessionImage(image.id, image.url);
      
      // Convert buffer to base64
      const base64Image = Buffer.from(rawImageBuffer).toString('base64');
      const dataUrl = `data:image/png;base64,${base64Image}`;
      
      rawImages.push(dataUrl);
    }

    return reply.code(200).send({
      acceptanceTime,
      person,
      document,
      rawImages,
      internalVerification: verification
     });
  } catch (error) {
    logger.error({ 
      error, 
      shopId: request.params.id, 
      sessionId: request.params.sessionId 
    }, "Failed to retrieve verification from Veriff");

    return reply.code(500).send({ error: "Failed to retrieve verification from Veriff" });
  }
}

export default route;
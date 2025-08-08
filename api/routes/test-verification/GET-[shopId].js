import { RouteHandler } from "gadget-server";

import { 
  getSessionMedia, 
  getSessionDecision, 
  getSessionImage,
  EXCLUDED_DOCUMENT_NAMES
} from "../../helpers/veriff";

/**
 * Route handler for test verification results
 *
 * @type { RouteHandler } route handler - see: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = async ({ request, reply, api, logger, connections }) => {
  try {
    const shopId = request.params.shopId;

    logger.info({ shopId }, 'Fetching test verification results');

    // Find the shop by ID
    const shop = await api.shopifyShop.findOne(shopId, {
      select: {
        id: true,
        name: true,
        domain: true,
        testVerificationSent: true,
      }
    });

    if (!shop) {
      await reply.code(404).send({ error: "Shop not found" });
      return;
    }

    if (!shop.testVerificationSent) {
      await reply.code(404).send({ error: "No test verification found for this shop" });
      return;
    }

    // Find the test verification for this shop
    const internalTestVerification = await api.verification.findFirst({
      filter: {
        shopId: {
          equals: shopId
        },
        test: {
          equals: true
        }
      },
      select: {
        id: true,
        sessionId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        emailId: true,
      }
    });

    if (!internalTestVerification) {
      await reply.code(404).send({ error: "Test verification not found" });
      return;
    }

    const veriffSessionMedia = await getSessionMedia(internalTestVerification.sessionId);
    const veriffSessionDecision = await getSessionDecision(internalTestVerification.sessionId);

    const { images } = veriffSessionMedia;
    const { person, document } = veriffSessionDecision;

    let rawImages = [];

    for (const image of images) {
      const rawImageBuffer = await getSessionImage(image.id, image.url);
      
      // Convert buffer to base64
      const base64Image = Buffer.from(rawImageBuffer).toString('base64');
      const dataUrl = `data:image/png;base64,${base64Image}`;
      
      if (!EXCLUDED_DOCUMENT_NAMES.includes(image.name)) {
        rawImages.push(dataUrl);
      }
    }

    logger.info({ shopId, sessionId: internalTestVerification.sessionId }, 'Test verification results retrieved from Veriff');

    return reply.code(200).send({
      acceptanceTime: internalTestVerification.updatedAt,
      person,
      document,
      rawImages,
      internalTestVerification
     });

  } catch (error) {
    logger.error(`Error fetching test verification results: ${error.message}`, { error });
    
    await reply.code(500).send({
      error: "Failed to fetch test verification results",
      message: error.message,
    });
  }
};

// Set route options including params schema validation
route.options = {
  schema: {
    params: {
      type: "object",
      properties: {
        shopId: { type: "string" },
      },
      required: ["shopId"],
    },
  },
};

export default route; 
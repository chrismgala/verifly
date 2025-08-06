import { RouteHandler } from "gadget-server";

import { plans } from "../helpers/plans";

/** @type { RouteHandler<{ Querystring: { shop_id: string, charge_id: string; }; }> }*/
const route = async ({ request, reply, api, logger, connections }) => {
  // Get an instance of the shopify-api-node API client for this shop
  const shopify = await connections.shopify.forShopId(request.query.shop_id);
  const shop = await api.shopifyShop.findOne(request.query.shop_id);

  if (!shopify) {
    throw new Error("Missing Shopify connection");
  }

  // Make an API call to Shopify to validate that the charge object for this shop is active
  const result = await shopify.graphql(`
    query {
      node(id: "gid://shopify/AppSubscription/${request.query.charge_id}") {
        id
        ... on AppSubscription {
          status
          name
        }
      }
    }
  `);

  if (result.node.status != "ACTIVE") {
    // The merchant has not accepted the charge, so we can show them a message
    await reply.code(400).send("Unable to complete transaction, please try again");
    return;
  }

  // The merchant has accepted the charge, so we can grant them access to our application
  // Example: mark the shop as paid by setting a `plan` attribute, this may vary for your billing model
  await api.shopifyShop.update(request.query.shop_id, {
    veriflyPlan: {
      _link: plans[request.query.plan].id
    }
  });

  // Send the user back to the embedded app's root
  await reply.redirect(`https://${shop.domain}/admin/apps/${shop.installedViaApiKey}`);
};

export default route;
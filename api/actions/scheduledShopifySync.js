import { ActionOptions } from "gadget-server";
import { globalShopifySync } from "gadget-server/shopify";

const HourInMs = 60 * 60 * 1000;

/** @type { ActionRun } */
export const run = async ({ params, logger, api, connections }) => {
  const syncOnlyModels = connections.shopify.enabledModels
    .filter(model => model.syncOnly)
    .map(model => model.apiIdentifier);

  const syncSince = new Date(Date.now() - 25 * HourInMs)

  await globalShopifySync({
    apiKeys: connections.shopify.apiKeys,
    syncSince,
    models: syncOnlyModels
  });
};

/** @type { ActionOptions } */
export const options = {
  // globalShopifySync may paginate and make multiple Shopify API calls.
  // Give it enough headroom for daily sync work.
  timeoutMS: 300000,
  triggers: {
    scheduler: [
      {
        every: "day",
        at: "17:48 UTC",
      },
    ],
  },
};

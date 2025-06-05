import { getDaysUntilTimestamp } from "../helpers/trialCalculations";

const TRIAL_LENGTH_IN_DAYS = 7;

/** @type { ActionRun } */
export const run = async ({ trigger, logger, api }) => {
  let shops = await api.shopifyShop.findMany({
    filter: {
      state: {
        inState: "created.installed",
      },
      veriflyPlan: {
        isSet: true,
      },
    },
    select: {
      id: true,
      name: true,
      trialStartedAt: true,
      activeRecurringSubscriptionId: true,
      activeUsageSubscriptionLineItemId: true,
      monthlyVerificationCount: true,
      verificationsEnabled: true
    },
    first: 250,
  });

  let allShops = shops;

  while (shops.hasNextPage) {
    shops = await shops.nextPage();
    allShops.push(...shops);
  }

  for (const shop of allShops) {
    if (!shop.verificationsEnabled) continue; // Usage safeguard

    const daysUntilTrialOver = getDaysUntilTimestamp(
      shop.trialStartedAt,
      TRIAL_LENGTH_IN_DAYS
    );

    // Trial still active
    if (daysUntilTrialOver > 0) continue; // Trial safeguard
    else {
      try {
        await api.enqueue(
          api.chargeForUsage,
          { shop: {
              id: shop.id,
              name: shop.name,
              activeRecurringSubscriptionId: shop.activeRecurringSubscriptionId,
              activeUsageSubscriptionLineItemId: shop.activeUsageSubscriptionLineItemId,
              monthlyVerificationCount: shop.monthlyVerificationCount,
              verificationsEnabled: shop.verificationsEnabled
            } 
          },
          {
            queue: {
              name: shop.id,
              maxConcurrency: 4,
            },
            retries: { 
              retryCount: 1, 
              initialInterval: 30 * 60 * 1000 // 30 minutes converted to milliseconds
            }
          }
        );
      } catch (error) {
        logger.error(
          { error, shopId: shop.id },
          "Error scheduling usage charges for shop"
        );
      }
    }
  }
};

export const options = {
  timeoutMS: 900000,
  triggers: {
    scheduler: [{ cron: "0 0 1 * *" }],
  },
};
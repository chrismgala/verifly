import {
  applyParams,
  preventCrossShopDataAccess,
  save,
  ActionOptions,
} from "gadget-server";

import { trialCalculations } from "../../../helpers/trialCalculations";

const PLANS = {
  essential: {
    id: 1,
    price: 9,
  },
  pro: {
    id: 2,
    price: 29,
  },
  max: {
    id: 3,
    price: 49,
  },
};

const capitalizeString = (str) => {
  return String(str).charAt(0).toUpperCase() + String(str).slice(1);
};

/** @type { ActionRun } */
export const run = async ({ 
  record, 
  params, 
  logger, 
  api, 
  connections,
  currentAppUrl 
}) => {
  applyParams(params, record);
  await preventCrossShopDataAccess(params, record);

  // Get the plan object from the list of available plans
  const planName = params.plan;
  const plan = PLANS[planName];
  let planFromDatabase;
  if (!plan) throw new Error(`[Subscribe] - Plan ${planName} does not exist`);

  // Get an instance of the shopify-api-node API client for this shop
  const shopify = connections.shopify.current;
  if (!shopify) {
    throw new Error(`[Subscribe] - Missing shopify connection`);
  }

  try {
    planFromDatabase = await api.plan.maybeFindOne(plan.id, {
      select: {
        id: true,
        name: true,
        usageCap: true,
      },
    });
  } catch (error) {
    throw new Error(`[Subscribe] - Failed to retrieve plan ${planName} from DB: ${error.message}`);
  }

  // Trial usage calculations
  const today = new Date();

  const { usedTrialMinutes } = trialCalculations(
    record.usedTrialMinutes,
    record.usedTrialMinutesUpdatedAt,
    today,
    7
  );

  /**
   * Create subscription record in Shopify
   * Shopify requires that the price of a subscription be non-zero. This template does not currently support free plans
   */
  const result = await shopify.graphql(
    `mutation ($name: String!, $returnUrl: URL!, $lineItems: [AppSubscriptionLineItemInput!]!, $test: Boolean!) {
      appSubscriptionCreate(name: $name, returnUrl: $returnUrl, lineItems: $lineItems, test: $test) {
        userErrors {
          field
          message
        }
        appSubscription {
          id
          lineItems {
            id
            plan {
              pricingDetails {
                __typename
              }
            }
          }
        }
        confirmationUrl
      }
    }`,
    {
      name: capitalizeString(planName),
      lineItems: [
        {
          plan: {
            appRecurringPricingDetails: {
              price: {
                amount: plan.price,
                currencyCode: "USD",
              },
              interval: "EVERY_30_DAYS",
            },
          },
        },
        {
          plan: {
            appUsagePricingDetails: {
              terms: "$1.00 per verification.",
              cappedAmount: {
                amount: planFromDatabase.usageCap.toFixed(2),
                currencyCode: "USD"
              }
            }
          }
        },
      ],
      returnUrl: `${currentAppUrl}finish-payment?shop_id=${connections.shopify.currentShop.id}&plan=${planName}`,
      test: process.env.NODE_ENV === "production" ? false : true,
    }
  );

  // Check for errors in subscription creation
  if (result?.appSubscriptionCreate?.userErrors?.length) {
    throw new Error(result?.appSubscriptionCreate?.userErrors[0]?.message || 
      "[Subscribe] - Shopify API failed to update app subscription");
  }

  // Updating the relevant shop record fields
  record.usedTrialMinutes = usedTrialMinutes;
  record.usedTrialMinutesUpdatedAt = today;
  record.activeRecurringSubscriptionId = result?.appSubscriptionCreate?.appSubscription?.id;
  record.confirmationUrl = result?.appSubscriptionCreate?.confirmationUrl;

  // Find the proper line item id. This is used later for creating usage records in Shopify
  for (const lineItem of result?.appSubscriptionCreate?.appSubscription?.lineItems) {
    if (lineItem.plan.pricingDetails.__typename === "AppUsagePricing") {
      record.activeUsageSubscriptionLineItemId = lineItem.id;
      break;
    }
  }

  await save(record);

  logger.info({ 
    appSubscriptionId: result?.appSubscriptionCreate?.appSubscription?.id,
    shopId: record.id
  }, "[Subscribe] - Created subscription");

  return {
    confirmationUrl: result?.appSubscriptionCreate?.confirmationUrl
  }
};

/** @type { ActionOptions } */
export const options = {
  actionType: "update",
  triggers: {
    api: true
  }
};

export const params = {
  // Plan name is sent to this action so that we can easily fetch the plan data
  plan: { type: "string" },
};
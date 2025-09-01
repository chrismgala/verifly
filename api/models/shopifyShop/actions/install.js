import { 
  transitionState, 
  applyParams, 
  save, 
  ActionOptions, 
  ShopifyShopState 
} from "gadget-server";

import { trialCalculations } from "../../../helpers/util";

/** @type { ActionRun } */
export const run = async ({ params, record, logger, api, connections }) => {
  transitionState(record, { to: ShopifyShopState.Installed });
  applyParams(params, record);
  await save(record);
};

/** @type { ActionOnSuccess } */
export const onSuccess = async ({ 
  params, 
  record, 
  logger, 
  api, 
  connections,
  currentAppUrl
}) => {
  // Log detailed information about the newly installed shop
  logger.info({
    message: "[App Install] - New shop installation successful",
    shopId: record.id,
    shopDomain: record.domain,
    shopName: record.name,
    shopEmail: record.email,
    shopCountry: record.country,
    shopPlan: record.planName,
    timezoneIANA: record.ianaTimezone
  });

  try {
    await api.shopifySync.run({
      shopifySync: {
        domain: record.domain,
        shop: {
          _link: record.id,
        },
        models: [
          "shopifyProduct",
          "shopifyProductVariant"
        ],
      },
    });

    // Initialize shop settings in our app by updating the shop record
    // with any default configurations or preferences
    await api.shopifyShop.update(record.id, {
      trialStartedAt: new Date(),
      usedTrialMinutesUpdatedAt: new Date()
    }, {
      select: {
        id: true,
        myshopifyDomain: true,
        name: true,
        monthlyVerificationCount: false
      }
    });

    // You could also set up initial resources for this shop
    // For example, creating default templates, configurations, etc.

    logger.info({
      message: "[App Install] - Shop initialization complete",
      shopId: record.id,
      shopDomain: record.domain
    });
  } catch (error) {
    // Log any errors that occur during initialization
    logger.error({
      message: "[App Install] - Error during shop initialization",
      shopId: record.id,
      shopDomain: record.domain,
      error: error.message
    });
  }

  // Create subscription in Shopify Admin API
  try {
    // Start the free trial with the base plan
    const shopify = connections.shopify.current;
    if (!shopify) {
      throw new Error("[App Install] - Missing Shopify connection");
    }

    const result = await shopify.graphql(
      `mutation ($name: String!, $returnUrl: URL!, $lineItems: [AppSubscriptionLineItemInput!]!, $trialDays: Int) {
        appSubscriptionCreate(name: $name, returnUrl: $returnUrl, lineItems: $lineItems, trialDays: $trialDays) {
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
        name: "Watchtower",
        trialDays: 7,
        lineItems: [
          {
            plan: {
              appRecurringPricingDetails: {
                price: {
                  amount: 49.00,
                  currencyCode: "USD",
                },
                interval: "EVERY_30_DAYS",
              },
            },
          },
          {
            plan: {
              appUsagePricingDetails: {
                terms: "$0.99 per verification.",
                cappedAmount: {
                  amount: 100000.00,
                  currencyCode: "USD"
                }
              }
            }
          }
        ],
        returnUrl: `${currentAppUrl}finish-payment?shop_id=${connections.shopify.currentShop.id}&plan=watchtower`,
      }
    );

    // Check for errors in subscription creation
    if (result?.appSubscriptionCreate?.userErrors?.length) {
      throw new Error(
        result?.appSubscriptionCreate?.userErrors[0]?.message ||
          "[App Install] - Shopify API failed to create app subscription"
      );
    }

    // Trial usage calculations
    const today = new Date();

    const { usedTrialMinutes } = trialCalculations(
      record.usedTrialMinutes,
      record.usedTrialMinutesUpdatedAt,
      today,
      7
    );
    
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

    logger.info(
      { 
        appSubscriptionId: result?.appSubscriptionCreate?.appSubscription?.id,
        shopId: record.id,
        shopDomain: record.domain
      },
      "[App Install] - Started free trial for new shop"
    );
  } catch (error) {
    // Log any errors that occur during subscription creation
    logger.error({
      message: "[App Install] - Failed to start free trial for new shop",
      shopId: record.id,
      shopDomain: record.domain,
      error: error.message
    });
  }
};

/** @type { ActionOptions } */
export const options = { actionType: "create" };

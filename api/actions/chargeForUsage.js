const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

/** @type { ActionRun } */
export const run = async ({ params, trigger, logger, api, connections }) => {
  const { shop } = params;

  if (!shop || 
    !shop.id || 
    !shop.activeRecurringSubscriptionId || 
    !shop.activeUsageSubscriptionLineItemId
  ) {
    throw new Error("[ChargeForUsage] - Missing required shop data");
  }

  if (!shop.monthlyVerificationCount) {
    throw new Error("[ChargeForUsage] - Missing monthly verification count or count is 0");
  }

  // Creating an instance of the Shopify Admin API
  const shopify = await connections.shopify.forShopId(shop?.id);
  if (!shopify) {
    throw new Error(`[ChargeForUsage] - Missing shopify connection`);
  }

  const { monthlyVerificationCount, veriflyPlan } = shop;
  
  const totalUsageCost = parseFloat(monthlyVerificationCount * veriflyPlan.usagePrice).toFixed(2);
  const currentMonth = new Date().getMonth();

  if (totalUsageCost > 0) {
    // Creating the usage charge with the Shopify Billing API
    const result = await shopify.graphql(
      `mutation ($description: String!, $price: MoneyInput!, $subscriptionLineItemId: ID!) {
        appUsageRecordCreate(description: $description, price: $price, subscriptionLineItemId: $subscriptionLineItemId) {
          appUsageRecord {
            id
          }
          userErrors {
            message
          }
        }
      }`,
      {
        description: `Charge of $${totalUsageCost} for verifications in ${MONTHS[currentMonth > 0 ? currentMonth - 1 : 11]}`,
        price: {
          amount: totalUsageCost,
          currencyCode: "USD",
        },
        subscriptionLineItemId: shop?.activeUsageSubscriptionLineItemId,
      }
    );

    // Throwing an error if the charge fails
    if (result?.appUsageRecordCreate?.userErrors?.length) {
      throw new Error(result.appUsageRecordCreate.userErrors[0].message);
    }
  }
};

export const options = {
  triggers: {
    api: true
  },
};

export const params = {
  shop: {
    type: "object",
    properties: {
      id: {
        type: "string",
      },
      name: {
        type: "string",
      },
      activeRecurringSubscriptionId: {
        type: "string",
      },
      activeUsageSubscriptionLineItemId: {
        type: "string",
      },
      monthlyVerificationCount: {
        type: "number",
      },
      verificationsEnabled: {
        type: "boolean",
      },
      veriflyPlan: {
        type: "object",
        properties: {
          id: { type: "string" },
          usagePrice: { type: "number" },
        },
      },
    },
  }
};

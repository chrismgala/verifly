import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "shopifyAppSubscription" model, go to https://verifly.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v2",
  storageKey: "DataModel-Shopify-AppSubscription",
  fields: {},
  searchIndex: false,
  shopify: {
    fields: {
      appUsageRecords: true,
      currentPeriodEnd: { filterIndex: false, searchIndex: false },
      lineItems: { filterIndex: false, searchIndex: false },
      name: { filterIndex: false, searchIndex: false },
      returnUrl: { filterIndex: false, searchIndex: false },
      shop: { searchIndex: false },
      shopifyCreatedAt: { filterIndex: false, searchIndex: false },
      status: { filterIndex: false, searchIndex: false },
      test: { filterIndex: false, searchIndex: false },
      trialDays: { filterIndex: false, searchIndex: false },
    },
  },
};

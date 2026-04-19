import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "shopifyAppUsageRecord" model, go to https://verifly.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v2",
  storageKey: "DataModel-Shopify-AppUsageRecord",
  fields: {},
  searchIndex: false,
  shopify: {
    fields: {
      appSubscription: { searchIndex: false },
      description: { filterIndex: false, searchIndex: false },
      idempotencyKey: { filterIndex: false, searchIndex: false },
      price: { filterIndex: false, searchIndex: false },
      shop: { searchIndex: false },
      shopifyCreatedAt: { filterIndex: false, searchIndex: false },
      subscriptionLineItem: {
        filterIndex: false,
        searchIndex: false,
      },
    },
  },
};

import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "shopifyAppPurchaseOneTime" model, go to https://verifly.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v2",
  storageKey: "DataModel-Shopify-AppPurchaseOneTime",
  fields: {},
  searchIndex: false,
  shopify: {
    fields: {
      name: { filterIndex: false, searchIndex: false },
      price: { filterIndex: false, searchIndex: false },
      shop: { searchIndex: false },
      shopifyCreatedAt: { filterIndex: false, searchIndex: false },
      status: { filterIndex: false, searchIndex: false },
      test: { filterIndex: false, searchIndex: false },
    },
  },
};

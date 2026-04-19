import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "shopifyAppCredit" model, go to https://verifly.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v2",
  storageKey: "DataModel-Shopify-AppCredit",
  fields: {},
  searchIndex: false,
  shopify: {
    fields: {
      amount: { filterIndex: false, searchIndex: false },
      description: { filterIndex: false, searchIndex: false },
      shop: { searchIndex: false },
      shopifyCreatedAt: { filterIndex: false, searchIndex: false },
      test: { filterIndex: false, searchIndex: false },
    },
  },
};

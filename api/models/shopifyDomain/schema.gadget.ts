import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "shopifyDomain" model, go to https://verifly.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v2",
  storageKey: "DataModel-Shopify-Domain",
  fields: {},
  searchIndex: false,
  shopify: {
    fields: {
      host: { filterIndex: false, searchIndex: false },
      localization: { filterIndex: false, searchIndex: false },
      shop: { searchIndex: false },
      sslEnabled: { filterIndex: false, searchIndex: false },
      url: { filterIndex: false, searchIndex: false },
    },
  },
};

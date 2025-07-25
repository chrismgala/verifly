import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "shopifyDomain" model, go to https://verifly.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "DataModel-Shopify-Domain",
  fields: {},
  shopify: {
    fields: ["host", "localization", "shop", "sslEnabled", "url"],
  },
};

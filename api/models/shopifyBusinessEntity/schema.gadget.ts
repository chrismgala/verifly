import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "shopifyBusinessEntity" model, go to https://verifly.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v2",
  storageKey: "DataModel-Shopify-BusinessEntity",
  fields: {},
  searchIndex: false,
  shopify: {
    fields: {
      address: { filterIndex: false, searchIndex: false },
      adminGraphqlApiId: { searchIndex: false },
      companyName: { filterIndex: false, searchIndex: false },
      displayName: { filterIndex: false, searchIndex: false },
      orders: true,
      primary: { filterIndex: false, searchIndex: false },
      shop: { searchIndex: false },
    },
  },
};

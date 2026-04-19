import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "shopifyFulfillmentService" model, go to https://verifly.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v2",
  storageKey: "DataModel-Shopify-FulfillmentService",
  fields: {},
  searchIndex: false,
  shopify: {
    fields: {
      adminGraphqlApiId: { searchIndex: false },
      callbackUrl: { filterIndex: false, searchIndex: false },
      format: { filterIndex: false, searchIndex: false },
      fulfillmentOrdersOptIn: {
        filterIndex: false,
        searchIndex: false,
      },
      handle: { filterIndex: false, searchIndex: false },
      inventoryManagement: { filterIndex: false, searchIndex: false },
      name: { filterIndex: false, searchIndex: false },
      permitsSkuSharing: { filterIndex: false, searchIndex: false },
      requiresShippingMethod: {
        filterIndex: false,
        searchIndex: false,
      },
      serviceName: { filterIndex: false, searchIndex: false },
      shop: { searchIndex: false },
      trackingSupport: { filterIndex: false, searchIndex: false },
      type: { filterIndex: false, searchIndex: false },
    },
  },
};

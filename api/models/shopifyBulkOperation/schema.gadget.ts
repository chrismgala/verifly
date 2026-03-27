import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "shopifyBulkOperation" model, go to https://verifly.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v2",
  storageKey: "DataModel-Shopify-BulkOperation",
  fields: {},
  shopify: {
    fields: {
      completedAt: true,
      errorCode: true,
      fileSize: true,
      objectCount: true,
      partialDataUrl: true,
      query: true,
      rootObjectCount: true,
      status: true,
      type: true,
      url: true,
    },
  },
};

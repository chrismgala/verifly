import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "shopifyBulkOperation" model, go to https://verifly.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v2",
  storageKey: "DataModel-Shopify-BulkOperation",
  fields: {},
  searchIndex: false,
  shopify: {
    fields: {
      completedAt: { filterIndex: false, searchIndex: false },
      errorCode: { filterIndex: false, searchIndex: false },
      fileSize: { filterIndex: false, searchIndex: false },
      objectCount: { filterIndex: false, searchIndex: false },
      partialDataUrl: { filterIndex: false, searchIndex: false },
      query: { filterIndex: false, searchIndex: false },
      rootObjectCount: { filterIndex: false, searchIndex: false },
      status: { filterIndex: false, searchIndex: false },
      type: { filterIndex: false, searchIndex: false },
      url: { filterIndex: false, searchIndex: false },
    },
  },
};

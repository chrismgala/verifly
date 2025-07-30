import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "verification" model, go to https://verifly.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "9JEJE8oIpo2t",
  fields: {
    customer: {
      type: "belongsTo",
      validations: { unique: true },
      parent: { model: "shopifyCustomer" },
      storageKey: "qlVm8Ee60dbO",
    },
    emailId: { type: "string", storageKey: "cxsFNXOYHL0W" },
    order: {
      type: "belongsTo",
      validations: { unique: true },
      parent: { model: "shopifyOrder" },
      storageKey: "5g1Hq0gVbBTB",
    },
    sessionId: { type: "string", storageKey: "5JG9ky9DfdNl" },
    shop: {
      type: "belongsTo",
      parent: { model: "shopifyShop" },
      storageKey: "TZhAH_YJxiIC",
    },
    status: {
      type: "enum",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: [
        "approved",
        "declined",
        "resubmit",
        "expired",
        "pending",
        "abandoned",
      ],
      storageKey: "gO6__aZR9xf_",
    },
  },
};

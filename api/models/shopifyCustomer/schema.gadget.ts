import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "shopifyCustomer" model, go to https://verifly.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "DataModel-Shopify-Customer",
  fields: {
    platformCustomerId: {
      type: "number",
      validations: { unique: true },
      storageKey: "FMbW39ZFefU7",
    },
    status: {
      type: "enum",
      default: "unverified",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: ["unverified", "pending", "verified"],
      validations: { required: true },
      storageKey: "rAcTYIHE6Eim",
    },
    verification: {
      type: "hasOne",
      child: { model: "verification", belongsToField: "customer" },
      storageKey: "l6m88MZ4DoLs",
    },
  },
  shopify: {
    fields: [
      "acceptsMarketing",
      "acceptsMarketingUpdatedAt",
      "checkouts",
      "currency",
      "dataSaleOptOut",
      "email",
      "emailMarketingConsent",
      "firstName",
      "lastName",
      "lastOrder",
      "lastOrderName",
      "locale",
      "marketingOptInLevel",
      "metafield",
      "multipassIdentifier",
      "note",
      "orders",
      "ordersCount",
      "paymentMethods",
      "phone",
      "shop",
      "shopifyCreatedAt",
      "shopifyState",
      "shopifyUpdatedAt",
      "smsMarketingConsent",
      "statistics",
      "tags",
      "taxExempt",
      "taxExemptions",
      "totalSpent",
      "verifiedEmail",
    ],
  },
};

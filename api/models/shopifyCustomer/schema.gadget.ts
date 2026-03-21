import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "shopifyCustomer" model, go to https://verifly.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "DataModel-Shopify-Customer",
  fields: {
    metafield: {
      type: "json",
      storageKey:
        "ModelField-DataModel-Shopify-Customer-metafield::FieldStorageEpoch-DataModel-Shopify-Customer-metafield-initial",
    },
    ordersCount: {
      type: "number",
      storageKey:
        "ModelField-DataModel-Shopify-Customer-orders_count::FieldStorageEpoch-DataModel-Shopify-Customer-orders_count-initial",
    },
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
      options: [
        "approved",
        "declined",
        "resubmission_request",
        "expired",
        "abandoned",
        "unverified",
      ],
      storageKey: "rAcTYIHE6Eim",
    },
    taxExemptionsBackup: {
      type: "json",
      storageKey:
        "ModelField-DataModel-Shopify-Customer-tax_exemptions::FieldStorageEpoch-DataModel-Shopify-Customer-tax_exemptions-initial",
    },
    totalSpent: {
      type: "string",
      storageKey:
        "ModelField-DataModel-Shopify-Customer-total_spent::FieldStorageEpoch-DataModel-Shopify-Customer-total_spent-initial",
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
      "amountSpent",
      "canDelete",
      "checkouts",
      "currency",
      "dataSaleOptOut",
      "displayName",
      "email",
      "emailMarketingConsent",
      "firstName",
      "hasTimelineComment",
      "lastName",
      "lastOrder",
      "lastOrderName",
      "legacyResourceId",
      "lifetimeDuration",
      "locale",
      "marketingOptInLevel",
      "multipassIdentifier",
      "note",
      "numberOfOrders",
      "orders",
      "paymentMethods",
      "phone",
      "productSubscriberStatus",
      "shop",
      "shopifyCreatedAt",
      "shopifyState",
      "shopifyUpdatedAt",
      "smsMarketingConsent",
      "statistics",
      "tags",
      "taxExempt",
      "taxExemptions",
      "unsubscribeUrl",
      "validEmailAddress",
      "verifiedEmail",
    ],
  },
};

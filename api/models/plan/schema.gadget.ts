import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "plan" model, go to https://verifly.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "cw7smhMvwwHK",
  fields: {
    description: { type: "string", storageKey: "jqD1-EpZkL0R" },
    features: {
      type: "enum",
      default: [],
      acceptMultipleSelections: true,
      acceptUnlistedOptions: true,
      options: [
        "Fully automated ID verifications",
        "Selfie capture & biometric verification",
        "Instant verification decisions",
        "Email notifications (new customers only)",
        "Manual override",
        "View customer provided docs in app",
        "Filter by product, variant and price",
        "Custom domain and branding for emails",
        "Everything in previous plan(s)",
        "Video recordings",
        "Block repeat violators by face",
        "Detailed risk analysis",
        "Global blacklist detection",
        "Automatic session deletion for privacy",
        "Custom branding in verification flow",
        "Choose 1 of 3 previous plans w/ add-ons",
        "2 year data retention (+$0.40 / check)",
        "Custom data extraction (+$0.40 / check)",
        "Gov watchlist screening (+$0.70 / check)",
      ],
      storageKey: "XZPSpWyO7XtP",
    },
    name: { type: "string", storageKey: "2eoNueMSatWX" },
    price: { type: "number", storageKey: "9dYli2Qm6FDl" },
    shop: {
      type: "hasMany",
      children: {
        model: "shopifyShop",
        belongsToField: "veriflyPlan",
      },
      storageKey: "RVcnBlFui_av",
    },
    usageCap: { type: "number", storageKey: "TlqfUa1C5iJR" },
    usagePrice: {
      type: "number",
      decimals: 2,
      storageKey: "XfDuJg1kuMIg",
    },
    visible: { type: "boolean", storageKey: "W-zMYknOTRKt" },
  },
};

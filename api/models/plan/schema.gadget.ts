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
        "Email notifications",
        "SMS notifications",
        "Custom branding",
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
    visible: { type: "boolean", storageKey: "W-zMYknOTRKt" },
  },
};

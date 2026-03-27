import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "shopifyApp" model, go to https://verifly.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v2",
  storageKey: "DataModel-Shopify-App",
  fields: {},
  shopify: {
    fields: {
      apiKey: true,
      appStoreAppUrl: true,
      appStoreDeveloperUrl: true,
      availableAccessScopes: true,
      description: true,
      developerName: true,
      developerType: true,
      embedded: true,
      failedRequirements: true,
      features: true,
      feedback: true,
      handle: true,
      installations: true,
      previouslyInstalled: true,
      pricingDetails: true,
      pricingDetailsSummary: true,
      privacyPolicyUrl: true,
      publicCategory: true,
      published: true,
      requestedAccessScopes: true,
      shopifyDeveloped: true,
      title: true,
      uninstallMessage: true,
      webhookApiVersion: true,
    },
  },
};

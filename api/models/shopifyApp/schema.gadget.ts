import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "shopifyApp" model, go to https://verifly.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v2",
  storageKey: "DataModel-Shopify-App",
  fields: {},
  searchIndex: false,
  shopify: {
    fields: {
      apiKey: { filterIndex: false, searchIndex: false },
      appStoreAppUrl: { filterIndex: false, searchIndex: false },
      appStoreDeveloperUrl: {
        filterIndex: false,
        searchIndex: false,
      },
      availableAccessScopes: {
        filterIndex: false,
        searchIndex: false,
      },
      description: { filterIndex: false, searchIndex: false },
      developerName: { filterIndex: false, searchIndex: false },
      developerType: { filterIndex: false, searchIndex: false },
      embedded: { filterIndex: false, searchIndex: false },
      failedRequirements: { filterIndex: false, searchIndex: false },
      features: { filterIndex: false, searchIndex: false },
      feedback: { filterIndex: false, searchIndex: false },
      handle: { filterIndex: false, searchIndex: false },
      installations: true,
      previouslyInstalled: { filterIndex: false, searchIndex: false },
      pricingDetails: { filterIndex: false, searchIndex: false },
      pricingDetailsSummary: {
        filterIndex: false,
        searchIndex: false,
      },
      privacyPolicyUrl: { filterIndex: false, searchIndex: false },
      publicCategory: { filterIndex: false, searchIndex: false },
      published: { filterIndex: false, searchIndex: false },
      requestedAccessScopes: {
        filterIndex: false,
        searchIndex: false,
      },
      shopifyDeveloped: { filterIndex: false, searchIndex: false },
      title: { filterIndex: false, searchIndex: false },
      uninstallMessage: { filterIndex: false, searchIndex: false },
      webhookApiVersion: { filterIndex: false, searchIndex: false },
    },
  },
};

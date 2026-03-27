import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "shopifyProduct" model, go to https://verifly.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v2",
  storageKey: "DataModel-Shopify-Product",
  fields: {},
  shopify: {
    fields: {
      body: true,
      category: true,
      compareAtPriceRange: true,
      handle: true,
      hasVariantsThatRequiresComponents: true,
      productCategory: true,
      productType: true,
      publishedAt: true,
      shop: true,
      shopifyCreatedAt: true,
      shopifyUpdatedAt: true,
      status: true,
      tags: true,
      templateSuffix: true,
      title: true,
      variants: true,
      vendor: true,
    },
  },
};

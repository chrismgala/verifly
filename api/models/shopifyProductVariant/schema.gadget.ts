import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "shopifyProductVariant" model, go to https://verifly.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v2",
  storageKey: "DataModel-Shopify-ProductVariant",
  fields: {
    needsVerification: {
      type: "boolean",
      default: false,
      validations: { required: true },
      storageKey: "CF8K7-bRW9ev",
    },
  },
  shopify: {
    fields: {
      availableForSale: true,
      barcode: true,
      compareAtPrice: true,
      inventoryPolicy: true,
      inventoryQuantity: true,
      option1: true,
      option2: true,
      option3: true,
      position: true,
      presentmentPrices: true,
      price: true,
      product: true,
      selectedOptions: true,
      shop: true,
      shopifyCreatedAt: true,
      shopifyUpdatedAt: true,
      sku: true,
      taxCode: true,
      taxable: true,
      title: true,
    },
  },
};

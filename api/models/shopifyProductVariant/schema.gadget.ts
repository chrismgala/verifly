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
      searchIndex: false,
    },
  },
  searchIndex: false,
  shopify: {
    fields: {
      availableForSale: { filterIndex: false, searchIndex: false },
      barcode: { filterIndex: false, searchIndex: false },
      compareAtPrice: { filterIndex: false, searchIndex: false },
      inventoryPolicy: { filterIndex: false, searchIndex: false },
      inventoryQuantity: { filterIndex: false, searchIndex: false },
      option1: { filterIndex: false, searchIndex: false },
      option2: { filterIndex: false, searchIndex: false },
      option3: { filterIndex: false, searchIndex: false },
      position: { filterIndex: false, searchIndex: false },
      presentmentPrices: { filterIndex: false, searchIndex: false },
      price: { filterIndex: false, searchIndex: false },
      product: { searchIndex: false },
      selectedOptions: { filterIndex: false, searchIndex: false },
      shop: { searchIndex: false },
      shopifyCreatedAt: { filterIndex: false, searchIndex: false },
      shopifyUpdatedAt: { filterIndex: false, searchIndex: false },
      sku: { filterIndex: false, searchIndex: false },
      taxCode: { filterIndex: false, searchIndex: false },
      taxable: { filterIndex: false, searchIndex: false },
      title: { filterIndex: false, searchIndex: false },
    },
  },
};

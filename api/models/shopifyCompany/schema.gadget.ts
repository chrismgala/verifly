import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "shopifyCompany" model, go to https://verifly.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v2",
  storageKey: "DataModel-Shopify-Company",
  fields: {},
  shopify: {
    fields: {
      contactCount: true,
      contactRoleAssignments: true,
      contactsCount: true,
      customerSince: true,
      externalId: true,
      lifetimeDuration: true,
      locationsCount: true,
      name: true,
      note: true,
      orders: true,
      ordersCount: true,
      shop: true,
      shopifyCreatedAt: true,
      shopifyUpdatedAt: true,
      totalSpent: true,
    },
  },
};

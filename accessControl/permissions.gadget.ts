import type { GadgetPermissions } from "gadget-server";

/**
 * This metadata describes the access control configuration available in your application.
 * Grants that are not defined here are set to false by default.
 *
 * View and edit your roles and permissions in the Gadget editor at https://verifly.gadget.app/edit/settings/permissions
 */
export const permissions: GadgetPermissions = {
  type: "gadget/permissions/v1",
  roles: {
    "shopify-app-users": {
      storageKey: "Role-Shopify-App",
      models: {
        plan: {
          read: true,
        },
        shopifyAppCredit: {
          read: {
            filter:
              "accessControl/filters/shopify/shopifyAppCredit.gelly",
          },
          actions: {
            create: true,
            delete: true,
            update: true,
          },
        },
        shopifyAppInstallation: {
          read: {
            filter:
              "accessControl/filters/shopify/shopifyAppInstallation.gelly",
          },
          actions: {
            create: true,
            delete: true,
            update: true,
          },
        },
        shopifyAppPurchaseOneTime: {
          read: {
            filter:
              "accessControl/filters/shopify/shopifyAppPurchaseOneTime.gelly",
          },
          actions: {
            create: true,
            delete: true,
            update: true,
          },
        },
        shopifyAppSubscription: {
          read: {
            filter:
              "accessControl/filters/shopify/shopifyAppSubscription.gelly",
          },
          actions: {
            create: true,
            delete: true,
            update: true,
          },
        },
        shopifyAppUsageRecord: {
          read: true,
          actions: {
            create: true,
            delete: true,
            update: true,
          },
        },
        shopifyBulkOperation: {
          read: {
            filter:
              "accessControl/filters/shopify/shopifyBulkOperation.gelly",
          },
          actions: {
            cancel: true,
            complete: true,
            create: true,
            expire: true,
            fail: true,
            update: true,
          },
        },
        shopifyBusinessEntity: {
          read: {
            filter:
              "accessControl/filters/shopify/shopifyBusinessEntity.gelly",
          },
          actions: {
            create: true,
            delete: true,
            update: true,
          },
        },
        shopifyCheckout: {
          read: {
            filter:
              "accessControl/filters/shopify/shopifyCheckout.gelly",
          },
        },
        shopifyCompany: {
          read: {
            filter:
              "accessControl/filters/shopify/shopifyCompany.gelly",
          },
        },
        shopifyCompanyContactRoleAssignment: {
          read: {
            filter:
              "accessControl/filters/shopify/shopifyCompanyContactRoleAssignment.gelly",
          },
        },
        shopifyCustomer: {
          read: {
            filter:
              "accessControl/filters/shopify/shopifyCustomer.gelly",
          },
        },
        shopifyDomain: {
          read: {
            filter:
              "accessControl/filters/shopify/shopifyDomain.gelly",
          },
          actions: {
            create: true,
            delete: true,
            update: true,
          },
        },
        shopifyGdprRequest: {
          read: {
            filter:
              "accessControl/filters/shopify/shopifyGdprRequest.gelly",
          },
          actions: {
            create: true,
            update: true,
          },
        },
        shopifyOrder: {
          read: {
            filter:
              "accessControl/filters/shopify/shopifyOrder.gelly",
          },
        },
        shopifyProduct: {
          read: {
            filter:
              "accessControl/filters/shopify/shopifyProduct.gelly",
          },
        },
        shopifyShop: {
          read: {
            filter: "accessControl/filters/shopify/shopifyShop.gelly",
          },
          actions: {
            install: true,
            reinstall: true,
            subscribe: true,
            uninstall: true,
            update: true,
          },
        },
        shopifySync: {
          read: {
            filter: "accessControl/filters/shopify/shopifySync.gelly",
          },
          actions: {
            abort: true,
            complete: true,
            error: true,
            run: true,
          },
        },
        verification: {
          read: {
            filter:
              "api/models/shopifyShop/monthlyVerificationCount.gelly",
          },
        },
      },
      actions: {
        chargeForUsage: true,
        ordersCreate: true,
        scheduledShopifySync: true,
        scheduleUsageCharges: true,
      },
    },
    unauthenticated: {
      storageKey: "unauthenticated",
    },
  },
};

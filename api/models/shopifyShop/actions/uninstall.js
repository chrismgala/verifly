import { 
  transitionState, 
  applyParams, 
  save, 
  ActionOptions, 
  ShopifyShopState 
} from "gadget-server";
import { preventCrossShopDataAccess } from "gadget-server/shopify";

/** @type { ActionRun } */
export const run = async ({ params, record, logger, api, connections }) => {
  transitionState(record, {
    from: ShopifyShopState.Installed,
    to: ShopifyShopState.Uninstalled,
  });
  
  applyParams(params, record);
  await preventCrossShopDataAccess(params, record);

  // Shopify state
  record.accessToken = null;
  record.grantedScopes = null;

  // Subscription state
  record.activeRecurringSubscriptionId = null;
  record.activeUsageSubscriptionLineItemId = null;
  record.confirmationUrl = null;
  record.usedTrialMinutes = 0;
  record.usedTrialMinutesUpdatedAt = null;
  record.trialStartedAt = null;
  record.veriflyPlanId = null;
  
  await save(record);
};

/** @type { ActionOnSuccess } */
export const onSuccess = async ({ params, record, logger, api, connections }) => {
  // Your logic goes here
};

/** @type { ActionOptions } */
export const options = { actionType: "update" };
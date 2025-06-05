import { useFindOne } from "@gadgetinc/react";
import { Link } from "react-router";

import { Banner, Page } from "@shopify/polaris";

import { FullPageSpinner } from "./FullPageSpinner";
import { getDaysUntilTimestamp, api } from "../api";

const TRIAL_LENGTH_IN_DAYS = 7;

export const SubscriptionWrapper = ({ shopId, children }) => {
  const [{ fetching, data: currentShop }] = useFindOne(
    api.shopifyShop,
    shopId
  );

  // If we're loading the current shop data, show a spinner
  if (!currentShop || fetching) {
    return <FullPageSpinner />;
  }

  // If the shop has a plan, render the app and don't bug them about plans
  if (currentShop?.veriflyPlan) return children;

  // Don't show prompts if there is no trial start date
  if (!currentShop?.trialStartedAt) return children;

  const daysUntilTrialOver = getDaysUntilTimestamp(
    currentShop?.trialStartedAt,
    TRIAL_LENGTH_IN_DAYS
  );
  if (daysUntilTrialOver > 0) {
    // Free trial still active, show the app and a banner encouraging them to select a plan
    return (
      <>
        <Banner>
          You have {daysUntilTrialOver} day(s) left on your free trial. Please{" "}
          <Link to="/billing">select a plan</Link> to continue using Verifly!
        </Banner>
        {children}
      </>
    );
  } else {
    // Trial has expired
    return (
      <Page>
        <Banner tone="critical">
          Your trial has expired, please <Link to="/billing">select a plan</Link> to continue using Verifly.
        </Banner>
      </Page>
    );
  }
};
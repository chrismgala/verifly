import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from "react-router";
import { useFindMany } from "@gadgetinc/react";

import {   
  Page,
  BlockStack,
  Banner,
  Layout
} from "@shopify/polaris";

import { PlanCard } from "../components/PlanCard";
import { FullPageSpinner } from '../components/FullPageSpinner';
import { api } from "../api";

export const BillingPage = () => {
  const navigate = useNavigate();

  const [showErrorBanner, setShowErrorBanner] = useState(false);
  const [bannerContext, setBannerContext] = useState("");

  const [{ data: plans, fetching: fetchingPlans, error: errorFetchingPlans }] =
    useFindMany(api.plan, {
      select: {
        id: true,
        name: true,
        price: true,
        features: true,
        visible: true
      },
    });

  const handleDismiss = useCallback(() => {
    setShowErrorBanner(false);
  }, []); 

  // useEffect for showing an error banner when there's an issue fetching plans
  useEffect(() => {
    if (!fetchingPlans && errorFetchingPlans) {
      setBannerContext(errorFetchingPlans.message);
      setShowErrorBanner(true);
    } else if (fetchingPlans) {
      setShowErrorBanner(false);
    }
  }, [fetchingPlans, errorFetchingPlans]);

  if (fetchingPlans) {
    return <FullPageSpinner />;
  }

  return (
    <Page
      title="Billing"
      backAction={{
        content: "Shop Information",
        onAction: () => navigate("/"),
      }}
    >
      <BlockStack gap="500">
        {showErrorBanner && (
          <Banner
            title={bannerContext}
            tone="critical"
            onDismiss={handleDismiss}
          />
        )}
      
        <Layout>
          {plans?.length ? (
            plans?.map((plan, index) => (
              <Layout.Section variant="oneThird" key={plan.id}>
                <PlanCard
                    id={plan.id}
                    title={plan.name}
                    description={plan.description}
                    features={plan.features}
                    price={plan.price}
                    frequency="month"
                    visible={plan.visible}
                    buttonText={index === 0 ? "Select Plan" : "Coming Soon"}
                  />
              </Layout.Section>
            ))
          ) : null}
        </Layout>
      </BlockStack>
    </Page>
  );
}


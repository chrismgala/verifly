import { useState } from "react";
import { useOutletContext } from "react-router";

import { Page, Layout, CalloutCard } from "@shopify/polaris";

import { SetupGuide } from "../components/SetupGuide/SetupGuide";
import biometricsImageUrl from "../assets/biometrics-transparent.png";
import graphicPaymentUrl from "../assets/graphic-payment.jpeg";
import graphicSettingsUrl from "../assets/graphic-settings.jpeg";

export const IndexPage = () => {
  const { shop } = useOutletContext();
  const isTrialActivated = shop?.confirmationUrl && shop?.veriflyPlan;

  const setupGuideItems = [
    {
      id: 0,
      title: "Activate your trial",
      description:
        "Once you activate your trial, you'll be able to use Verifly to verify your customers' identities.",
      image: {
        url: graphicPaymentUrl,
        alt: "Illustration depicting credit card payment",
      },
      complete: isTrialActivated,
      primaryButton: {
        content: "Activate trial",
        props: {
          url: shop?.confirmationUrl
        },
      }
    },
    {
      id: 1,
      title: "Turn verifications on",
      description:
        "Automated ID verifications are turned off by default. Click on 'Go to Settings' below to turn them on.",
      image: {
        url: graphicSettingsUrl,
        alt: "Illustration depicting settings",
      },
      complete: shop?.setupComplete,
      primaryButton: {
        content: "Go to Settings",
        props: {
          url: "/settings"
        },
      }
    }
  ];

  const [showGuide, setShowGuide] = useState(true);
  const [items, setItems] = useState(setupGuideItems);

  return (
    <Page title="Dashboard">
      <Layout>
        <Layout.Section>
          {showGuide && (
            <SetupGuide
              onDismiss={() => {
                setShowGuide(false);
                setItems(setupGuideItems);
              }}
              items={setupGuideItems}
            />
          )}
        </Layout.Section>

        <Layout.Section>
          <CalloutCard
            title={`${shop?.shopOwner ?? "Hello"}, welcome to Verifly!`}
            illustration={biometricsImageUrl}
            primaryAction={{
              content: 'See Verifications',
              url: '/verifications',
            }}
          >
            <p>Verifly has facilitated <strong>{shop?.monthlyVerificationCount} verifications</strong> in the last 30 days!</p>
          </CalloutCard>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
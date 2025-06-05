import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from "react-router";
import { SaveBar, useAppBridge } from "@shopify/app-bridge-react";
import { useFetch } from "@gadgetinc/react";

import { 
  Page,
  Banner,
  Card,
  Grid,
  Layout,
  Text,
  TextField
} from "@shopify/polaris";

import { Knob } from "../components/Knob/Knob";

export const SettingsPage = () => {
  const navigate = useNavigate();
  const { shopId, shop } = useOutletContext();

  const isTrialActivated = shop?.confirmationUrl && shop?.veriflyPlan;

  const shopify = useAppBridge();

  // Update settings
  const [{ data, fetching, error }, send] = useFetch(`/settings/${shopId}`, { 
    method: "POST",
    headers: {
      "content-type": "application/json",
    }
  });

  const [verificationsEnabled, setVerificationsEnabled] = useState(shop?.verificationsEnabled);
  const [triggerPrice, setTriggerPrice] = useState(shop?.triggerPrice);

  useEffect(() => {
    async function updateSettings() {
      await send({
        body: JSON.stringify({
          verificationsEnabled,
          triggerPrice,
          setupComplete: true
        })
      });
    }

    shopify.saveBar.show('my-save-bar')
    void updateSettings();
  }, [verificationsEnabled, triggerPrice]);

  const handleSave = () => {
    shopify.saveBar.hide('my-save-bar');
  };

  const handleDiscard = () => {
    shopify.saveBar.hide('my-save-bar');
  };

  return (
    <Page
      title="Settings"
      backAction={{
        content: "Shop Information",
        onAction: () => navigate("/"),
      }}
    >
      <SaveBar id="my-save-bar">
        <button variant="primary" onClick={handleSave}></button>
        <button onClick={handleDiscard}></button>
      </SaveBar>

      <Layout>
        <Layout.Section>
          {!isTrialActivated && (
            <Banner 
              title="Your trial needs to be activated"
              tone="warning"
              action={{ content: 'Activate trial', url: shop?.confirmationUrl }}
            >
              <Text as="p" variant="bodyMd">
                Activating your free trial will allow you to turn on verifications.
              </Text>
            </Banner>
          )}
        </Layout.Section>

        <Layout.Section>
          <Card>
            <Grid className="settings-row">
              <Grid.Cell columnSpan={{xs: 11, sm: 11, md: 11, lg: 11, xl: 11}}>
                <Text as='h3' variant='headingMd'>
                  Big Red Button
                </Text>
                <Text as='p' variant='bodyMd'>
                  This will enable or disable all automated ID verifications for your shop.
                </Text>
              </Grid.Cell>

              <Grid.Cell columnSpan={{xs: 1, sm: 1, md: 1, lg: 1, xl: 1}}>
                <Knob
                  disabled={!isTrialActivated}
                  selected={verificationsEnabled}
                  ariaLabel='Big Red Button'
                  tone="critical"
                  onClick={() => setVerificationsEnabled((prev) => !prev)}
                />
              </Grid.Cell>
            </Grid>

            <Grid className="settings-row">
              <Grid.Cell columnSpan={{xs: 10, sm: 10, md: 10, lg: 10, xl: 10}}>
                <Text as='h3' variant='headingMd'>
                  Trigger Price
                </Text>
                
                <Text as='p' variant='bodyMd'>
                  This is a global trigger price for all order ID verifications. Anything greater than or equal to this number will trigger
                  a verification request (e.g. a trigger price of $100 will trigger a verification for orders for $100 and above).
                </Text>
              </Grid.Cell>

              <Grid.Cell columnSpan={{xs: 2, sm: 2, md: 2, lg: 2, xl: 2}}>
                <TextField
                  type="number"
                  prefix="$"
                  min={0}
                  value={triggerPrice}
                  onChange={setTriggerPrice}
                  autoComplete="off"
                  disabled={!isTrialActivated}
                  style={{ cursor: isTrialActivated ? 'not-allowed' : 'pointer' }}
                />
              </Grid.Cell>
            </Grid>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
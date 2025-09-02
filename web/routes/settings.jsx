import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from "react-router";
import { useAppBridge, SaveBar, Modal, TitleBar } from "@shopify/app-bridge-react";
import { useAction, useFetch } from "@gadgetinc/react";

import { 
  Page,
  Banner,
  Box,
  Card,
  Grid,
  Layout,
  Text,
  TextField,
  Select,
  DropZone,
  Thumbnail,
  Button,
  DataTable,
  Badge
} from "@shopify/polaris";

import { Knob } from "../components/Knob/Knob";
import { api } from "../api";

export const SettingsPage = () => {
  const shopify = useAppBridge();
  const { shopId, shop } = useOutletContext();

  const isTrialActivated = shop?.confirmationUrl && shop?.veriflyPlan;

  const [verificationsEnabled, setVerificationsEnabled] = useState(shop?.verificationsEnabled);
  const [triggerPrice, setTriggerPrice] = useState(shop?.triggerPrice);
  const [verificationFlow, setVerificationFlow] = useState(shop?.verificationFlow || 'post-checkout');
  const [logo, setLogo] = useState(shop?.logo);
  const [primaryColor, setPrimaryColor] = useState(shop?.primaryColor || '#FF6B35');
  const [secondaryColor, setSecondaryColor] = useState(shop?.secondaryColor || '#2196F3');
  const [emailDomain, setEmailDomain] = useState(shop?.emailDomain || '');
  const [emailDomainError, setEmailDomainError] = useState('');
  const [domainRecords, setDomainRecords] = useState(shop?.domainRecords || null);
  const [domainStatus, setDomainStatus] = useState(shop?.domainStatus || '');
  const [domainId, setDomainId] = useState(shop?.domainId || null);
  const [domainRecordsRows, setDomainRecordsRows] = useState([]);

  const isEmailDomainValid = emailDomain.length > 0 && emailDomain.match(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/);

  const options = [
    {label: 'Post-checkout', value: 'post-checkout'},
    {label: 'Pre-checkout', value: 'pre-checkout'},
  ];
  
  const handleSelectChange = useCallback(
    (value) => setVerificationFlow(value),
    [],
  );

  const handleLogoUpload = useCallback((files) => {
    if (files.length > 0) {
      setLogo(files[0]);
    }
  }, []);

  // Update settings
  const [{ data, fetching, error }, updateShop] = useAction(api.shopifyShop.update);

  // Check domain status in Resend
  const [{ data: statusData, fetching: statusFetching, error: statusError }] = useFetch(`/domain/${shop?.domainId}`, {
    method: "GET",
    json: true
  });

  // Create custom domain in Resend
  const [{ data: domainData, fetching: domainFetching, error: domainError }, createDomain] = useFetch(`/domain/${shopId}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    json: true
  });

  // Verify domain in Resend
  const [{ data: verifyData, fetching: verifyFetching, error: verifyError }, verifyDomain] = useFetch(`/domain/verify`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    }
  });

  useEffect(() => {
    shopify.saveBar.show('my-save-bar');
  }, [verificationsEnabled, triggerPrice, verificationFlow, logo, primaryColor, secondaryColor, emailDomain]);

  useEffect(() => {
    if (data || domainData) {
      shopify.toast.show('Settings saved successfully', { duration: 4000 });
    } else if (error || domainError) {
      shopify.toast.show('Unable to save settings', { duration: 4000, isError: true });
    }
  }, [data, error, domainData, domainError]);

  useEffect(() => {
    if (verifyData) {
      shopify.toast.show('Verifying domain', { duration: 4000 });
    } else if (verifyError) {
      shopify.toast.show('Unable to verify domain', { duration: 4000, isError: true });
    }
  }, [verifyData, verifyError]);

  useEffect(() => {
    if (domainData) {
      setDomainRecords(domainData?.domainRecords);
      setDomainStatus(domainData?.status);
      setDomainId(domainData?.domainId);
    }
  }, [domainData]);

  useEffect(() => {
    if (domainRecords) {
      const rows = Object.keys(domainRecords).map((key) => {
        return [
          domainRecords[key].record,
          domainRecords[key].type,
          domainRecords[key].name,
          domainRecords[key].value,
          domainRecords[key].ttl,
          domainRecords[key].priority,
          domainRecords[key].status,
        ];
      });

      setDomainRecordsRows(rows);
    }
  }, [domainRecords]);

  useEffect(() => {
    if (statusData) {
      setDomainStatus(statusData?.status);
    }
  }, [statusData]);

  const handleSave = async () => {
    updateShop({
      id: shopId,
      verificationsEnabled,
      triggerPrice: parseFloat(triggerPrice),
      verificationFlow,
      ...(logo && !logo?.url && { logo: { file: logo } }),
      primaryColor,
      secondaryColor,
      emailDomain,
      setupComplete: !!verificationsEnabled
    });

    if (emailDomain) {
      await createDomain({
        body: JSON.stringify({
          domain: emailDomain
        })
      });
    }

    shopify.saveBar.hide('my-save-bar');
  };

  const handleVerifyDomain = async () => {
    await verifyDomain({
      body: JSON.stringify({
        domainId: shop?.domainId
      })
    });
  };

  const handleDiscard = () => {
    shopify.saveBar.hide('my-save-bar');
  };

  return (
    <Page
      title="Settings"
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
            <Box paddingBlock="400">
              <Text as='h2' variant='headingLg'>
                General
              </Text>
            </Box>

            <Grid>
              <Grid.Cell columnSpan={{xs: 11, sm: 11, md: 11, lg: 11, xl: 11}}>
                <Text as='h3' variant='headingMd'>
                  Big Red Button
                </Text>
                <Text as='p' variant='bodyMd'>
                  This will enable or disable all automated ID verifications for your shop.
                </Text>
              </Grid.Cell>

              <Grid.Cell columnSpan={{xs: 1, sm: 1, md: 1, lg: 1, xl: 1}}>
                <div style={{ textAlign: 'right' }}>
                  <Knob
                    disabled={!isTrialActivated}
                    selected={verificationsEnabled}
                    ariaLabel='Big Red Button'
                    tone="critical"
                    onClick={() => setVerificationsEnabled((prev) => !prev)}
                  />
                </div>
              </Grid.Cell>
            </Grid>

            <Grid>
              <Grid.Cell columnSpan={{xs: 9, sm: 9, md: 9, lg: 9, xl: 9}}>
                <Text as='h3' variant='headingMd'>
                  Trigger Price
                </Text>
                
                <Text as='p' variant='bodyMd'>
                  This is a global trigger price for all order ID verifications. Anything greater than or equal to this number will trigger
                  a verification request (e.g. a trigger price of $100 will trigger a verification for orders for $100 and above).
                </Text>
              </Grid.Cell>

              <Grid.Cell columnSpan={{xs: 3, sm: 3, md: 3, lg: 3, xl: 3}}>
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

            <Grid>
              <Grid.Cell columnSpan={{xs: 9, sm: 9, md: 9, lg: 9, xl: 9}}>
                <Text as='h3' variant='headingMd'>
                  Verification Flow
                </Text>
                
                <Text as='p' variant='bodyMd'>
                  Pre-checkout will show an embedded verification flow on the cart page, before the customer can checkout.
                  Post-checkout will email a verification link to the customer after they place an order. 
                  If you're using pre-checkout, you must <a href={`https://${shop.myshopifyDomain}/admin/themes/current/editor?context=apps&template=cart&activateAppId=${process.env.GADGET_PUBLIC_THEME_EXTENSION_ID}/verify`} target="_blank">install</a> the theme extension as an App Embed.
                </Text>
              </Grid.Cell>

              <Grid.Cell columnSpan={{xs: 3, sm: 3, md: 3, lg: 3, xl: 3}}>
                <Select
                  disabled={!isTrialActivated}
                  options={options}
                  onChange={handleSelectChange}
                  value={verificationFlow}
                />
              </Grid.Cell>
            </Grid>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <Box paddingBlock="400">
              <Text as='h2' variant='headingLg'>
                Branding
              </Text>
            </Box>
            
            <Grid>
              <Grid.Cell columnSpan={{xs: 9, sm: 9, md: 9, lg: 9, xl: 9}}>
                <Text as='h3' variant='headingMd'>
                  Logo
                </Text>
                <Text as='p' variant='bodyMd'>
                  Upload your company logo for verification emails (recommended: 200x80px)
                </Text>
              </Grid.Cell>

              <Grid.Cell columnSpan={{xs: 3, sm: 3, md: 3, lg: 3, xl: 3}}>
                <DropZone
                  accept="image/*"
                  type="image"
                  allowMultiple={false}
                  onDrop={handleLogoUpload}
                  disabled={!isTrialActivated}
                >
                  {logo ? (
                    <div style={{ 
                      width: '100%', 
                      height: '100%', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center' 
                    }}>
                      <Thumbnail
                        size="large"
                        alt={logo.name}
                        source={
                          logo.url ? logo.url : window.URL.createObjectURL(logo)
                        }
                      />
                    </div>
                  ) : (
                    <DropZone.FileUpload />
                  )}
                </DropZone>
              </Grid.Cell>
            </Grid>

            <Grid>
              <Grid.Cell columnSpan={{xs: 9, sm: 9, md: 9, lg: 9, xl: 9}}>
                <Text as='h3' variant='headingMd'>
                  Primary Color
                </Text>
                <Text as='p' variant='bodyMd'>
                  This will be used for the background color of the verification email. Enter a hex color code (e.g. #FF6B35).
                </Text>
              </Grid.Cell>

              <Grid.Cell columnSpan={{xs: 3, sm: 3, md: 3, lg: 3, xl: 3}}>
                <div style={{ textAlign: 'right' }}>
                  <input type="color" value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} disabled={!isTrialActivated} />
                </div>
              </Grid.Cell>
            </Grid>

            <Grid>
              <Grid.Cell columnSpan={{xs: 9, sm: 9, md: 9, lg: 9, xl: 9}}>
                <Text as='h3' variant='headingMd'>
                  Secondary Color
                </Text>
                <Text as='p' variant='bodyMd'>
                  This will be used for any buttons in the verification email. Enter a hex color code (e.g. #2196F3).
                </Text>
              </Grid.Cell>

              <Grid.Cell columnSpan={{xs: 3, sm: 3, md: 3, lg: 3, xl: 3}}>
                <div style={{ textAlign: 'right' }}>
                  <input type="color" value={secondaryColor} onChange={(event) => setSecondaryColor(event.target.value)} disabled={!isTrialActivated} />
                </div>
              </Grid.Cell>
            </Grid>

            <Grid>
              <Grid.Cell columnSpan={{xs: 9, sm: 9, md: 9, lg: 9, xl: 9}}>
                <Text as='h3' variant='headingMd'>
                  Email Domain {displayVerificationBadge(domainStatus)}
                </Text>
                
                <Text as='p' variant='bodyMd'>
                  This is the domain that verification emails will be sent from. If left empty, the email will be sent from info@verifly.shop.
                </Text>
              </Grid.Cell>

              <Grid.Cell columnSpan={{xs: 3, sm: 3, md: 3, lg: 3, xl: 3}}>
                <div style={{ textAlign: 'right' }}>
                  {domainStatus !== 'verified' && domainId ? (
                    <Button
                      onClick={() => {
                        shopify.modal.show('domain-records');
                      }}
                    >
                      Verify Domain
                    </Button>
                  ) : (
                    <TextField
                      type="text"
                      value={emailDomain}
                      onChange={setEmailDomain}
                      onBlur={() => {
                        if (!isEmailDomainValid) {
                          setEmailDomainError('Domain is not valid');
                        } else {
                          setEmailDomainError('');
                        }
                      }}
                      placeholder="example.com"
                      error={emailDomainError}
                      autoComplete="off"
                      disabled={!isTrialActivated}
                    />
                  )}
                </div>
              </Grid.Cell>
            </Grid>
          </Card>
        </Layout.Section>
      </Layout>

      <Modal id="domain-records" variant="large">
        <TitleBar title="Domain Records">
          <button variant="primary" onClick={handleVerifyDomain}>Verify</button>
          <button onClick={() => shopify.modal.hide('domain-records')}>Close</button>
        </TitleBar>

        <Box padding="400">
          <Text as='p' variant='bodyMd'>
            The following records need to be added to your domain's DNS settings to verify your domain. 
            Once you've added them, click "Verify" to initiate the verification process.
          </Text>

          <DataTable
            columnContentTypes={[
              'text',
              'text',
              'text',
              'text',
              'text',
              'numeric',
              'text'
            ]}
            headings={[
              'Record',
              'Type',
              'Name',
              'Value',
              'TTL',
              'Priority',
              'Status',
            ]}
            rows={domainRecordsRows}
          />
        </Box>
      </Modal>
    </Page>
  );
}

export function displayVerificationBadge(status) {
  switch (status) {
    case 'verified':
      return <Badge tone="success">Verified</Badge>;
    case 'failed':
      return <Badge tone="critical">Failed</Badge>;
    case 'pending':
      return <Badge tone="attention">Pending</Badge>;
    case 'not_started':
      return <Badge tone="info">Not started</Badge>;
    case 'temporary_failure':
      return <Badge tone="warning">Temporary failure</Badge>;
    default:
      return null;
  }
}

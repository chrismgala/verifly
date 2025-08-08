import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from "react-router";
import { useFetch } from '@gadgetinc/react';
import { Modal, TitleBar, useAppBridge } from '@shopify/app-bridge-react';

import { 
  Page, 
  Layout, 
  TextField, 
  Button, 
  Banner, 
  Text,
  BlockStack
} from '@shopify/polaris';

export const TestVerificationPage = () => {
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const { shopId, shop } = useOutletContext();

  const isTrialActivated = shop?.confirmationUrl && shop?.veriflyPlan;

  const [testEmail, setTestEmail] = useState('');
  const [testVerificationSent, setTestVerificationSent] = useState(shop?.testVerificationSent);

  // Fetch test verification results
  const [{ data, fetching: resultsFetching }, fetchResults] = useFetch(`/test-verification/${shopId}`, {
    method: 'GET',
    json: true
  });

  // Send test verification
  const [{ data: sendData, fetching: sending, error: sendError }, sendTestVerification] = useFetch(`/test-verification/${shopId}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
  });

  const person = data?.person;
  const document = data?.document;
  const rawImages = data?.rawImages;
  const acceptanceTime = data?.acceptanceTime;
  const internalTestVerification = data?.internalTestVerification;

  const sendTest = async () => {
    try {
      await sendTestVerification({
        body: JSON.stringify({ testEmail }),
      });
      setTestEmail('');
      setTestVerificationSent(true);
    } catch (error) {
      shopify.toast.show('Unable to send verification', { duration: 4000, isError: true });
    }
  };

  const getResults = async () => {
    try {
      await fetchResults();
      shopify.modal.show('verification-results');
    } catch (error) {
      shopify.toast.show('Unable to view results', { duration: 4000, isError: true });
    }
  };

   // Show success / error toast
   useEffect(() => {
    if (sendData) {
      shopify.toast.show('Verification sent successfully', { duration: 4000 });
    } else if (sendError) {
      shopify.toast.show('Unable to send verification', { duration: 4000, isError: true });
    }

  }, [sendData, sendError]);

  return (
    <Page 
      title="Test Verification" 
      subtitle="Each shop is allowed to send 1 test verification to whomever. If the form is disabled, it means you haven't activated your trial or you've used your test verification."
      backAction={{
        content: "Products",
        onAction: () => navigate("/products"),
      }}
      primaryAction={{
        content: "View Results",
        onAction: getResults,
        disabled: !testVerificationSent || (internalTestVerification?.status === 'pending'),
        loading: resultsFetching,
      }}
    >
      <Layout>
        <Layout.Section>
          {!isTrialActivated && (
            <Banner 
              title="Your trial needs to be activated"
              tone="warning"
              action={{ content: 'Activate trial', url: shop?.confirmationUrl }}
            >
              <Text as="p" variant="bodyMd">
                Activating your free trial will allow you to send a test verification.
              </Text>
            </Banner>
          )}
        </Layout.Section>

        <Layout.AnnotatedSection
          title="Will I be charged?"
          description="This will not count against your usage limits. You will be able to see the results below if you complete the verification process."
        >
          <div style={{ maxWidth: 400 }}>
            <TextField
              label="Email address"
              type="email"
              placeholder="Test email address"
              value={testEmail}
              onChange={setTestEmail}
              autoComplete="off"
              disabled={!isTrialActivated || sending || testVerificationSent}
            />
            <div style={{ marginTop: 16 }}>
              <Button
                variant="primary"
                onClick={sendTest}
                disabled={!isTrialActivated || !testEmail.trim() || sending || testVerificationSent}
                loading={sending}
                fullWidth
              >
                Send Test
              </Button>
            </div>
          </div>
        </Layout.AnnotatedSection>
      </Layout>

      <Modal id="verification-results">
        <TitleBar title="Verification Results">
          <button onClick={() => shopify.modal.hide('verification-results')}>Close</button>
        </TitleBar>

        <BlockStack gap="400">
          <BlockStack gap="200">
            <Text as="h2" variant="headingSm">
              Customer
            </Text>

            <Text as="p" variant="bodyMd">
              {person?.firstName?.value} {person?.lastName?.value}
            </Text>
          </BlockStack>

          <BlockStack gap="200">
            <Text as="h2" variant="headingSm">
              Address
            </Text>

            <div>
              <Text as="p" variant="bodyMd">
                {person?.address?.components?.houseNumber} {person?.address?.components?.road}
              </Text>
              {person?.address?.components?.unit && (
                <Text as="p" variant="bodyMd">
                  {person?.address?.components?.unit}
                </Text>
              )}
              <Text as="p" variant="bodyMd">
                {person?.address?.components?.city}, {person?.address?.components?.state} {person?.address?.components?.postcode}
              </Text>
            </div>
          </BlockStack>

          <BlockStack gap="200">
            <Text as="h2" variant="headingSm">
              Document Type
            </Text>

            <Text as="p" variant="bodyMd">
              {document?.type?.value === 'drivers_license' && 'Driver\'s License'}
              {document?.type?.value === 'passport' && 'Passport'}
              {document?.type?.value === 'id_card' && 'ID Card'}
              {document?.type?.value === 'residence_permit' && 'Residence Permit'}
              {document?.type?.value === 'other' && 'Other'}
            </Text>
          </BlockStack>

          <BlockStack gap="200">
            <Text as="h2" variant="headingSm">
              Verification Date
            </Text>

            <Text as="p" variant="bodyMd">
              {new Date(acceptanceTime).toLocaleString()}
            </Text>
          </BlockStack>

          <BlockStack gap="200">
            <Text as="h2" variant="headingSm">
              Images
            </Text>

            <BlockStack gap="200">
              {rawImages?.map((image, index) => (
                <img key={index} src={image} />
              ))}
            </BlockStack>
          </BlockStack>
        </BlockStack>
      </Modal>
    </Page>
  );
} 
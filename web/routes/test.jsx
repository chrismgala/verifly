import { useState } from 'react';
import { useOutletContext } from "react-router";
import { useSession, useFetch } from '@gadgetinc/react';

import { Page, Layout, TextField, Button } from '@shopify/polaris';

export const TestPage = () => {
  const { shopId, shop } = useOutletContext();

  const isTrialActivated = shop?.confirmationUrl && shop?.veriflyPlan;

  const [testEmail, setTestEmail] = useState('');
  const [testVerificationSent, setTestVerificationSent] = useState(shop?.testVerificationSent);

  // Test verification
  const [{ fetching: testVerificationFetching }, sendTestVerification] = useFetch(`/test-verification/${shopId}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
  });

  const handleTestVerification = async () => {
    try {
      await sendTestVerification({
        body: JSON.stringify({ testEmail }),
      });
      setTestEmail('');
      setTestVerificationSent(true);
    } catch (error) {
      // Optionally show error toast
    }
  };

  return (
    <Page title="Test" subtitle="Each shop is allowed to send 1 test verification. If the form is disabled, it means you haven't activated your trial or you've used your test verification.">
      <Layout>
        <Layout.AnnotatedSection
          title="Test Verification"
          description="Send a test verification to ensure the app is working correctly. This will not count against your usage limits."
        >
          <div style={{ maxWidth: 400 }}>
            <TextField
              label="Email address"
              type="email"
              placeholder="Test email address"
              value={testEmail}
              onChange={setTestEmail}
              autoComplete="off"
              disabled={!isTrialActivated || testVerificationFetching || testVerificationSent}
            />
            <div style={{ marginTop: 16 }}>
              <Button
                variant="primary"
                onClick={handleTestVerification}
                disabled={!isTrialActivated || !testEmail.trim() || testVerificationFetching || testVerificationSent}
                loading={testVerificationFetching}
                fullWidth
              >
                Send Test
              </Button>
            </div>
          </div>
        </Layout.AnnotatedSection>
      </Layout>
    </Page>
  );
} 
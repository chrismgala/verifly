import { useOutletContext, useParams, useNavigate } from "react-router";
import { Modal, TitleBar, useAppBridge } from '@shopify/app-bridge-react';
import { useFetch } from "@gadgetinc/react";

import { 
  Page, 
  Badge, 
  BlockStack, 
  Card, 
  Text, 
  Button 
} from "@shopify/polaris";

import { FullPageError } from "../components/FullPageError";
import { FullPageSpinner } from "../components/FullPageSpinner";

export const VerificationPage = () => {
  const { shopId } = useOutletContext();
  const { id, sessionId } = useParams();

  const navigate = useNavigate();
  const shopify = useAppBridge();

  // Data fetching
  const [{ data, fetching, error }] = useFetch(`/order-verification/${id}/${sessionId}`, { 
    method: "GET",
    json: true
  });

  const lastVerificationReport = data?.lastVerificationReport;
  const files = data?.files;

  if (error) { console.error(error); }
  else if (!lastVerificationReport && !fetching) {
    return (
      <FullPageError
        title="Error fetching verification details"
        message="Please refresh the page. If the problem persists, take a screenshot of this page and email it and your shop's name to support@verifly.shop."
      />
    );
  } else if (fetching && !lastVerificationReport) {
    return <FullPageSpinner />;
  }

  return (
    <Page
      title="Verification"
      titleMetadata={displayVerificationBadge(lastVerificationReport?.document?.status)}
      primaryAction={lastVerificationReport?.document?.status !== 'verified' ? { content: 'Override', onAction: () => {} } : null}
      backAction={{
        content: "Verification",
        onAction: () => navigate("/verifications"),
      }}
    >
      <Card>
        <BlockStack gap="400">
          <BlockStack gap="200">
            <Text as="h2" variant="headingSm">
              Customer
            </Text>

            <Text as="p" variant="bodyMd">
              {lastVerificationReport?.document?.first_name} {lastVerificationReport?.document?.last_name}
            </Text>
          </BlockStack>
          
          <BlockStack gap="200">
            <Text as="h2" variant="headingSm">
              Address
            </Text>

            <div>
              <Text as="p" variant="bodyMd">
                {lastVerificationReport?.document?.address?.line1}
              </Text>
              <Text as="p" variant="bodyMd">
                {lastVerificationReport?.document?.address?.line2}
              </Text>
              <Text as="p" variant="bodyMd">
                {lastVerificationReport?.document?.address?.city}, {lastVerificationReport?.document?.address?.state} {lastVerificationReport?.document?.address?.postal_code}
              </Text>
            </div>
          </BlockStack>

          <BlockStack gap="200">
            <Text as="h2" variant="headingSm">
              Document Type
            </Text>

            <div>
              <Text as="p" variant="bodyMd">
                {lastVerificationReport?.document?.type === 'driving_license' ? 'Driver License' : 'Other'}
              </Text>
            </div>
          </BlockStack>

          <BlockStack gap="200">
            <Text as="h2" variant="headingSm">
              Verification Date
            </Text>

            <div>
              <Text as="p" variant="bodyMd">
                {new Date(lastVerificationReport?.created * 1000).toLocaleString()}
              </Text>
            </div>
          </BlockStack>

          <Button onClick={() => shopify.modal.show('verification-document-images')}>View Document Images</Button>
        </BlockStack>
      </Card>

      <Modal id="verification-document-images">
        <TitleBar title="Document Images">
          <button onClick={() => shopify.modal.hide('verification-document-images')}>Close</button>
        </TitleBar>

        <div>
          {files?.map((file, index) => (
            <img key={index} src={file} />
          ))}
        </div>
      </Modal>
    </Page>
  );

  function displayVerificationBadge(status) {
    switch (status) {
      case 'verified':
        return <Badge tone="success">Verified</Badge>;
      case 'pending':
        return <Badge tone="critical">Action required</Badge>;
      case 'unverified':
        return <Badge tone="warning">Unverified</Badge>;
      default:
    }
  }
}
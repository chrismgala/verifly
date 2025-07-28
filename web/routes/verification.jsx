import { useState, useEffect } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router";
import { Modal, TitleBar, useAppBridge } from '@shopify/app-bridge-react';
import { useFetch } from "@gadgetinc/react";

import { 
  Page, 
  Badge, 
  BlockStack, 
  Card, 
  Text, 
  Button,
  SkeletonPage,
  SkeletonBodyText,
  SkeletonDisplayText
} from "@shopify/polaris";

import { FullPageError } from "../components/FullPageError";

export const VerificationPage = () => {
  const { shopId } = useOutletContext();
  const { id, sessionId } = useParams();

  const navigate = useNavigate();
  const shopify = useAppBridge();

  // Local state for immediate UI updates
  const [localVerificationStatus, setLocalVerificationStatus] = useState(null);
  const [isOverriding, setIsOverriding] = useState(false);

  // Data fetching
  const [{ data, fetching, error }] = useFetch(`/order-verification/${id}/${sessionId}`, { 
    method: "GET",
    json: true
  });

  // Override verification
  const [{ data: overrideData, fetching: overrideFetching, error: overrideError }, send] = useFetch(`/order-verification/${id}/${sessionId}`, { 
    method: "POST",
    headers: {
      "content-type": "application/json",
    }
  });

  const person = data?.person;
  const document = data?.document;
  const rawImages = data?.rawImages;
  const acceptanceTime = data?.acceptanceTime;
  const internalVerification = data?.internalVerification;

  // Initialize local state when data is loaded
  useEffect(() => {
    if (internalVerification?.status && !localVerificationStatus) {
      setLocalVerificationStatus(internalVerification.status);
    }
  }, [internalVerification?.status, localVerificationStatus]);

  // Handle override response
  useEffect(() => {
    if (overrideData && !overrideFetching && !overrideError) {
      // Update local state immediately
      setLocalVerificationStatus('approved');
      setIsOverriding(false);
    } else if (overrideError) {
      console.error('Override error:', overrideError);
      setIsOverriding(false);
    }
  }, [overrideData, overrideFetching, overrideError]);

  const overrideVerification = async () => {
    setIsOverriding(true);
    
    await send({
      body: JSON.stringify({
        override: true
      })
    });
  }

  // Use local status for UI, fallback to server status
  const currentStatus = localVerificationStatus || internalVerification?.status;
  const isVerified = currentStatus === 'approved';
  const isLoading = isOverriding || overrideFetching;

  if (error) { console.error(error); }
  else if (!lastVerificationReport && !fetching) {
    return (
      <FullPageError
        title="Error fetching verification details"
        message="Please refresh the page. If the problem persists, take a screenshot of this page and email it and your shop's name to support@verifly.shop."
      />
    );
  } else if (fetching && !lastVerificationReport) {
    return (
      <SkeletonPage primaryAction>
        <Card>
          <BlockStack gap="400">
            <BlockStack gap="200">
              <SkeletonDisplayText size="small" />
              <SkeletonBodyText lines={1} />
            </BlockStack>
            <BlockStack gap="200">
              <SkeletonDisplayText size="small" />
              <SkeletonBodyText lines={2} />
            </BlockStack>
            <BlockStack gap="200">
              <SkeletonDisplayText size="small" />
              <SkeletonBodyText lines={1} />
            </BlockStack>
            <BlockStack gap="200">
              <SkeletonDisplayText size="small" />
              <SkeletonBodyText lines={1} />
            </BlockStack>
            <SkeletonBodyText lines={1} />
          </BlockStack>
        </Card>
      </SkeletonPage>
    );
  } else {
    return (
      <Page
        title="Verification"
        titleMetadata={displayVerificationBadge(currentStatus)}
        primaryAction={!isVerified ? { 
          content: 'Approve', 
          onAction: overrideVerification,
          loading: isLoading
        } : null}
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
                {person?.firstName} {person?.lastName}
              </Text>
            </BlockStack>
  
            <BlockStack gap="200">
              <Text as="h2" variant="headingSm">
                Document Type
              </Text>
  
              <div>
                <Text as="p" variant="bodyMd">
                  {document?.type === 'DRIVERS_LICENSE' && 'Driver\'s License'}
                  {document?.type === 'PASSPORT' && 'Passport'}
                  {document?.type === 'ID_CARD' && 'ID Card'}
                  {document?.type === 'RESIDENCE_PERMIT' && 'Residence Permit'}
                  {document?.type === 'OTHER' && 'Other'}
                </Text>
              </div>
            </BlockStack>
  
            <BlockStack gap="200">
              <Text as="h2" variant="headingSm">
                Verification Date
              </Text>
  
              <div>
                <Text as="p" variant="bodyMd">
                  {new Date(acceptanceTime).toLocaleString()}
                </Text>
              </div>
            </BlockStack>
  
            <Button onClick={() => shopify.modal.show('verification-document-images')}>View Verification Images</Button>
          </BlockStack>
        </Card>
  
        <Modal id="verification-document-images">
          <TitleBar title="Verification Images">
            <button onClick={() => shopify.modal.hide('verification-document-images')}>Close</button>
          </TitleBar>
  
          <div>
            {rawImages?.map((image, index) => (
              <img key={index} src={image} />
            ))}
          </div>
        </Modal>
      </Page>
    );
  }

  function displayVerificationBadge(status) {
    switch (status) {
      case 'approved':
        return <Badge tone="success">Approved</Badge>;
      case 'denied':
        return <Badge tone="critical">Denied</Badge>;
      case 'resubmit':
        return <Badge tone="attention">Resubmission required</Badge>;
      case 'expired':
        return <Badge tone="warning">Expired</Badge>;
      case 'abandoned':
        return <Badge tone="warning">Abandoned</Badge>;
      case 'pending':
        return <Badge tone="info">Pending</Badge>;
      default:
    }
  }
}
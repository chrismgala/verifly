import { useState } from 'react';
import { useNavigate, useOutletContext, Link } from "react-router";
import { useFetch } from "@gadgetinc/react";

import {
  Page,
  Badge,
  Text,
  IndexTable,
  Card,
  IndexFilters,
  useSetIndexFiltersMode,
  useIndexResourceState,
  EmptySearchResult,
} from '@shopify/polaris';

import { FullPageError } from "../components/FullPageError";
import { FullPageSpinner } from "../components/FullPageSpinner";

export const VerificationsPage = () => {
  // Initial setup
  const navigate = useNavigate();
  const { shopId } = useOutletContext();

  // Data fetching
  const [{ data, fetching, error }] = useFetch(`/order-verifications/${shopId}`, { 
    method: "GET",
    json: true
  });

  // Call the resend-verification API
  const [{ data: resendData, fetching: resendFetching, error: resendError }, resend] = useFetch(`/resend-verification/${shopId}`, { 
    method: "POST",
    headers: {
      "content-type": "application/json",
    }
  });

  const verifications = data?.verifications;

  // UI state
  const [views, setViews] = useState([
    'All',
    // 'Verified',
    // 'Unverified',
  ]);
  const [selected, setSelected] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const tabs = views.map((item, index) => ({
    content: item,
    index,
    id: `${item}-${index}`,
    isLocked: index === 0,
  }));
  
  const { mode, setMode } = useSetIndexFiltersMode();

  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(verifications);

  // Error & empty state handling
  const emptyStateMarkup = (
    <EmptySearchResult
      title="No verifications yet"
      description="Try changing the filters or search term"
      withIllustration
    />
  );

  if (error) { console.error(error); }
  else if (!verifications && !fetching) {
    return (
      <FullPageError
        title="Error fetching verifications"
        message="Please refresh the page. If the problem persists, take a screenshot of this page and email it and your shop's name to support@verifly.shop."
      />
    );
  } else if (fetching && !verifications) {
    return <FullPageSpinner />;
  }

  // Bulk action: Resend Email
  const canResend =
    selectedResources.length === 1 &&
    (() => {
      const selectedIndex = selectedResources[0];
      const selectedVerification = verifications?.[selectedIndex];
      
      return selectedVerification && 
        selectedVerification.customer.status !== 'approved' &&
        selectedVerification.customer.status !== 'declined';
    })();

  const handleResendEmail = async () => {
    if (selectedResources.length !== 1) return;
    
    const selectedIndex = selectedResources[0];
    const selectedVerification = verifications?.[selectedIndex];
    
    if (!selectedVerification) return;
    
    setIsResending(true);
    
    await resend({
      body: JSON.stringify({
        verificationId: selectedVerification.id,
        verificationSessionId: selectedVerification.sessionId
      })
    });

    setIsResending(false);
  };

  const bulkActions = [
    {
      content: 'Resend Email',
      onAction: handleResendEmail,
      disabled: !canResend || isResending,
    },
  ];

  return (
    <Page
      title="Verifications"
      subtitle="Click on the order number to view the customer's verification details"
      backAction={{
        content: "Shop Information",
        onAction: () => navigate("/"),
      }}
    >
      <Card>
        <IndexFilters
          tabs={tabs}
          selected={selected}
          onSelect={setSelected}
          canCreateNewView={false}
          mode={mode}
          setMode={setMode}
        />

        <IndexTable
          itemCount={verifications?.length || 0}
          selectedItemsCount={
            allResourcesSelected ? 'All' : selectedResources.length
          }
          onSelectionChange={handleSelectionChange}
          headings={[
            {title: 'Order'},
            {title: 'Customer'},
            {title: 'Status'},
            {title: 'Last updated'},
          ]}
          emptyState={emptyStateMarkup}
          promotedBulkActions={bulkActions}
        >
          {verifications && verifications.map(
            (
              { orderName, customer, updatedAt, id, sessionId },
              index,
            ) => (
              <IndexTable.Row
                id={index}
                key={index}
                selected={selectedResources.includes(index)}
                position={index}
              >
                <IndexTable.Cell>
                  {customer.status === 'approved' ? (
                    <Link to={`/verification/${id}/${sessionId}`}>
                      <Text variant="bodyMd" fontWeight="bold" as="span">
                        {orderName}
                      </Text>
                    </Link>
                  ) : (
                    <Text variant="bodyMd" as="span">
                      {orderName}
                    </Text>
                  )}
                </IndexTable.Cell>

                <IndexTable.Cell>
                  <Text variant="bodyMd" as="span">
                    {customer.email}
                  </Text>
                </IndexTable.Cell>
                
                <IndexTable.Cell>
                  {displayVerificationBadge(customer.status)}
                </IndexTable.Cell>
                
                <IndexTable.Cell>
                  <Text variant="bodyMd" as="span">
                    {new Date(updatedAt).toLocaleString()}
                  </Text>
                </IndexTable.Cell>
              </IndexTable.Row>
            ),
          )}
        </IndexTable>
      </Card>
    </Page>
  );
}

export function displayVerificationBadge(status) {
  switch (status) {
    case 'approved':
      return <Badge tone="success">Approved</Badge>;
    case 'declined':
      return <Badge tone="critical">Declined</Badge>;
    case 'resubmit':
      return <Badge tone="attention">Resubmission required</Badge>;
    case 'expired':
      return <Badge tone="warning">Expired</Badge>;
    case 'abandoned':
      return <Badge tone="warning">Abandoned</Badge>;
    case 'pending':
      return <Badge tone="info">Pending</Badge>;
    default:
      return null;
  }
}

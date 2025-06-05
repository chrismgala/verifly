import { useState } from 'react';
import { useNavigate, useOutletContext, Link } from "react-router";
import { useFetch } from "@gadgetinc/react";
import { differenceInDays } from "date-fns";

import {
  Page,
  Text,
  IndexTable,
  Card,
  IndexFilters,
  useSetIndexFiltersMode,
  useIndexResourceState,
  Badge,
  EmptySearchResult
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

  const verifications = data?.verifications;

  // UI state
  const [views, setViews] = useState([
    'All',
    // 'Verified',
    // 'Unverified',
  ]);
  const [selected, setSelected] = useState(0);

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

  return (
    <Page
      title="Verifications"
      subtitle="Only verifications from the last 48 hours can be overridden"
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
                  {differenceInDays(new Date(), new Date(updatedAt)) >= 2 ? (
                    <Text variant="bodyMd" fontWeight="bold" as="span">
                      {orderName}
                    </Text>
                  ) : (
                    <Link to={`/verification/${id}/${sessionId}`}>
                      <Text variant="bodyMd" fontWeight="bold" as="span">
                        {orderName}
                      </Text>
                    </Link>
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

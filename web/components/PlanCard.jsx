import { useState } from "react";
import { useOutletContext } from "react-router";

import { 
  BlockStack, 
  Card, 
  Text, 
  InlineStack, 
  Box, 
  Badge, 
  ButtonGroup 
} from "@shopify/polaris";
import { AutoButton } from "@gadgetinc/react/auto/polaris";

import { capitalizeString, api } from "../api";

export const PlanCard = ({ 
  id,
  title, 
  description, 
  price, 
  features,
  featuredText,
  frequency,
  visible,
  buttonText
}) => {
  const { shop } = useOutletContext();

  const [disabled, setDisabled] = useState(false);

  return (
    <div
      style={{
        width: "18rem",
        boxShadow: featuredText ? "0px 0px 15px 4px #CDFEE1" : "none",
        borderRadius: ".75rem",
        position: "relative",
        zIndex: "0",
      }}
    >
      {featuredText ? (
        <div style={{ position: "absolute", top: "-15px", right: "6px", zIndex: "100" }}>
          <Badge size="large" tone="success">
            {featuredText}
          </Badge>
        </div>
      ) : null}

      <Card>
        <BlockStack gap="400">
          <BlockStack gap="200" align="start">
            <Text as="h3" variant="headingLg">
              {capitalizeString(title)}
            </Text>

            {description ? (
              <Text as="p" variant="bodySm" tone="subdued">
                {description}
              </Text>
            ) : null}
          </BlockStack>

          <InlineStack blockAlign="end" gap="100" align="start">
            <Text as="h2" variant="heading2xl">
              ${price}
            </Text>

            <Box paddingBlockEnd="200">
              <Text variant="bodySm">/ {frequency}</Text>
            </Box>
          </InlineStack>

          <InlineStack blockAlign="end" gap="100" align="start">
            <Box paddingBlockEnd="200">
              <Text variant="bodySm">+ $1.00 per verification</Text>
            </Box>
          </InlineStack>

          <BlockStack gap="100">
            {features?.map((feature, id) => (
              <Text tone="subdued" as="p" variant="bodyMd" key={id}>
                {feature}
              </Text>
            ))}
          </BlockStack>

          <Box paddingBlockStart="200" paddingBlockEnd="200">
            <ButtonGroup fullWidth>
              <AutoButton
                action={api.shopifyShop.subscribe}
                disabled={shop?.veriflyPlan?.id === id || !visible || disabled}
                onSuccess={({ data }) => {
                  setDisabled(true);
                  open(data?.confirmationUrl, "_top");
                }}
                variables={{ id: shop?.id ?? "", plan: title }}
                children={shop?.veriflyPlan?.id === id ? "Subscribed" : buttonText}
              />
            </ButtonGroup>
          </Box>
        </BlockStack>
      </Card>
    </div>
  );
};
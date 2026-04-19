import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";

import { api } from "./api";

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const { data } = shopify;
  const [verificationPayload, setVerificationPayload] = useState(/** @type {any} */ (null));
  const [verificationRecord, setVerificationRecord] = useState(/** @type {any} */ (null));
  const [localVerificationStatus, setLocalVerificationStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOverriding, setIsOverriding] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const orderId = useMemo(() => {
    const selectedId = data?.selected?.[0]?.id;
    if (!selectedId) return null;
    return selectedId.split("/").pop() || null;
  }, [data?.selected]);

  const currentStatus =
    localVerificationStatus ||
    verificationPayload?.internalVerification?.status ||
    null;
  const isVerified = currentStatus === "approved";

  useEffect(() => {
    const fetchVerification = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      if (!orderId) {
        setErrorMessage("No order ID was provided by Shopify for this page.");
        setIsLoading(false);
        return;
      }

      try {
        // @ts-ignore
        const verification = /** @type {any} */ (await api.verification.maybeFindFirst({
          filter: {
            orderId: {
              equals: orderId,
            },
          },
        }));

        if (!verification?.sessionId) {
          setErrorMessage("No verification was found for this order.");
          setIsLoading(false);
          return;
        }

        setVerificationRecord(verification);

        // @ts-ignore
        const response = await api.fetch(
          `/order-verification/${verification.id}/${verification.sessionId}`,
          {
            method: "GET",
            headers: {
              "content-type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Fetch failed with status ${response.status}`);
        }

        const payload = await response.json();
        setVerificationPayload(payload);
        setLocalVerificationStatus(payload?.internalVerification?.status || null);
      } catch (error) {
        console.error("Failed to fetch order verification results:", error);
        setErrorMessage(
          "Could not load verification details. Please try again in a moment."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerification();
  }, [orderId]);

  const personalInfoRows = useMemo(() => {
    const person = verificationPayload?.person;
    if (!person) return [];

    const rows = [];
    for (const key in person) {
      if (person[key]?.value) {
        rows.push({
          label: normalizeCamelCase(key),
          value: person[key].value,
          confidence: CONFIDENCE_LEVEL_MAP[person[key].confidenceCategory] || "-",
        });
      }
    }

    rows.sort((a, b) => a.label.localeCompare(b.label));
    return rows;
  }, [verificationPayload?.person]);

  const documentInfoRows = useMemo(() => {
    const document = verificationPayload?.document;
    if (!document) return [];

    const rows = [];
    for (const key in document) {
      if (document[key]?.value) {
        rows.push({
          label: normalizeCamelCase(key),
          value:
            key === "type"
              ? normalizeDocumentType(document[key].value)
              : document[key].value,
          confidence: CONFIDENCE_LEVEL_MAP[document[key].confidenceCategory] || "-",
        });
      }
    }

    rows.sort((a, b) => a.label.localeCompare(b.label));
    return rows;
  }, [verificationPayload?.document]);

  return (
    <s-admin-block heading="ID Verification">
      {isLoading && <s-spinner />}

      {!isLoading && errorMessage && (
        <s-banner tone="critical">{errorMessage}</s-banner>
      )}

      
      {!isLoading && !errorMessage && (
        <s-stack direction="block" gap="base">
          <s-grid gridTemplateColumns="repeat(12, 1fr)" gap="base" justifyContent="space-between">
            {verificationPayload?.internalVerification?.status && (
              <s-grid-item gridColumn="span 4" gridRow="span 1">
                <s-stack direction="inline" gap="small-300">
                  <s-heading>Status:</s-heading>
                  <s-badge tone={isVerified ? "success" : "warning"}>
                    {displayVerificationLabel(currentStatus)}
                  </s-badge>
                </s-stack>
              </s-grid-item>
            )}
            
            {verificationPayload?.decisionScore != null && (
              <s-grid-item gridColumn="span 4" gridRow="span 1">
                <s-stack direction="inline" gap="small-300">
                  <s-heading>Confidence:</s-heading>
                  <s-text>
                    {Math.round(Number(verificationPayload.decisionScore) * 100)} / 100
                  </s-text>
                </s-stack>
              </s-grid-item>
            )}

            {verificationPayload?.acceptanceTime && (
              <s-grid-item gridColumn="span 4" gridRow="span 1">
                <s-stack direction="inline" gap="small-300">
                  <s-heading>Date:</s-heading>
                  <s-text>
                    {new Date(verificationPayload.acceptanceTime).toLocaleString()}
                  </s-text>
                </s-stack>
              </s-grid-item>
            )}
          </s-grid>

          <s-stack direction="block" gap="small-300">
            <s-heading>Personal Information</s-heading>
            {personalInfoRows.length === 0 ? (
              <s-text>No personal information returned.</s-text>
            ) : (
              <s-table>
                <s-table-header-row>
                  <s-table-header>Field</s-table-header>
                  <s-table-header>Value</s-table-header>
                  <s-table-header>Confidence</s-table-header>
                </s-table-header-row>
                <s-table-body>
                  {personalInfoRows.map((row) => (
                    <s-table-row key={`person-${row.label}`}>
                      <s-table-cell>{row.label}</s-table-cell>
                      <s-table-cell>{row.value}</s-table-cell>
                      <s-table-cell>{row.confidence}</s-table-cell>
                    </s-table-row>
                  ))}
                </s-table-body>
              </s-table>
            )}

            <s-heading>Document Information</s-heading>
            {documentInfoRows.length === 0 ? (
              <s-text>No document information returned.</s-text>
            ) : (
              <s-table>
                <s-table-header-row>
                  <s-table-header>Field</s-table-header>
                  <s-table-header>Value</s-table-header>
                  <s-table-header>Confidence</s-table-header>
                </s-table-header-row>
                <s-table-body>
                  {documentInfoRows.map((row) => (
                    <s-table-row key={`document-${row.label}`}>
                      <s-table-cell>{row.label}</s-table-cell>
                      <s-table-cell>{row.value}</s-table-cell>
                      <s-table-cell>{row.confidence}</s-table-cell>
                    </s-table-row>
                  ))}
                </s-table-body>
              </s-table>
            )}

            <s-heading>Images</s-heading>
            {!verificationPayload?.rawImages?.length && (
              <s-text>No images returned.</s-text>
            )}
            {verificationPayload?.rawImages?.map((image, index) => (
              <s-image
                key={`image-${index}`}
                src={image}
                alt={`Verification image ${index + 1}`}
              />
            ))}
          </s-stack>
        </s-stack>
      )}
    </s-admin-block>
  );
}

const CONFIDENCE_LEVEL_MAP = {
  high: "🟢",
  medium: "🟡",
  low: "🔴",
};

const normalizeDocumentType = (type) => {
  switch (type) {
    case "drivers_license":
      return "Driver's License";
    case "passport":
      return "Passport";
    case "id_card":
      return "ID Card";
    case "residence_permit":
      return "Residence Permit";
    case "other":
      return "Other";
    default:
      return "Unknown Document";
  }
};

const capitalizeString = (value = "") =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "";

const normalizeCamelCase = (value = "") =>
  value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();

const displayVerificationLabel = (status) => {
  if (!status) return "Pending";
  return normalizeCamelCase(status);
};
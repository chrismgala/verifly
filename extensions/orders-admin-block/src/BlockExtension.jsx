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
          sources: person[key].sources?.join(", ") || "-",
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
          sources: document[key].sources?.join(", ") || "-",
        });
      }
    }

    rows.sort((a, b) => a.label.localeCompare(b.label));
    return rows;
  }, [verificationPayload?.document]);

  const insightsRows = useMemo(() => {
    const insights = verificationPayload?.insights;
    if (!insights) return [];

    const rows = insights.map((insight) => ({
      category: capitalizeString(insight.category),
      detail:
        INSIGHTS_MAP?.[insight.category]?.[insight.label] || normalizeCamelCase(insight.label),
      result: insight.result === "yes" ? "✅ Pass" : "❌ Fail",
    }));

    rows.sort((a, b) => a.category.localeCompare(b.category));
    return rows;
  }, [verificationPayload?.insights]);

  return (
    <s-admin-block heading="Verifly Verification">
      <s-stack direction="block" gap="base">
        <s-stack direction="inline" gap="small-100">
          <s-text>Verification status:</s-text>
          <s-badge tone={isVerified ? "success" : "warning"}>
            {displayVerificationLabel(currentStatus)}
          </s-badge>
        </s-stack>

        {verificationPayload?.acceptanceTime && (
          <s-text>
            Completion date: {new Date(verificationPayload.acceptanceTime).toString()}
          </s-text>
        )}

        {isLoading && <s-spinner />}

        {!isLoading && errorMessage && (
          <s-banner tone="critical">{errorMessage}</s-banner>
        )}

        {!isLoading && !errorMessage && (
          <s-stack direction="block">
            <s-divider />
            <s-heading>Personal Information</s-heading>
            {personalInfoRows.length === 0 && (
              <s-text>No personal information returned.</s-text>
            )}
            {personalInfoRows.map((row) => (
              <s-box key={`person-${row.label}`}>
                <s-text>
                  {row.label}: {row.value}
                </s-text>
                <s-text tone="neutral">
                  Confidence {row.confidence} • Sources: {row.sources}
                </s-text>
              </s-box>
            ))}

            <s-divider />
            <s-heading>Document Information</s-heading>
            {documentInfoRows.length === 0 && (
              <s-text>No document information returned.</s-text>
            )}
            {documentInfoRows.map((row) => (
              <s-box key={`document-${row.label}`}>
                <s-text>
                  {row.label}: {row.value}
                </s-text>
                <s-text tone="neutral">
                  Confidence {row.confidence} • Sources: {row.sources}
                </s-text>
              </s-box>
            ))}

            <s-divider />
            <s-heading>Verification Insights</s-heading>
            {verificationPayload?.decisionScore != null && (
              <s-text>
                Decision score: {Math.round(Number(verificationPayload.decisionScore) * 100)} / 100
              </s-text>
            )}
            {insightsRows.length === 0 && (
              <s-text>No insights returned.</s-text>
            )}
            {insightsRows.map((row, idx) => (
              <s-box key={`insight-${idx}`}>
                <s-text>
                  {row.category}: {row.result}
                </s-text>
                <s-text tone="neutral">{row.detail}</s-text>
              </s-box>
            ))}

            <s-divider />
            <s-heading>Verification Images</s-heading>
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
        )}
      </s-stack>
    </s-admin-block>
  );
}

const INSIGHTS_MAP = {
  document: {
    documentAccepted:
      "The presented document is accepted in the integration and the session can proceed with further validation checks.",
    documentFrontImageAvailable:
      "The image of the front of the document is present and can be used for the verification.",
    documentFrontFullyVisible: "The image of front of the document fully visible.",
    documentBackImageAvailable:
      "The image of the back of the document is present and can be used for the verification.",
    documentBackFullyVisible: "The image of back of the document fully visible.",
    documentImageQualitySufficient:
      "The document image meets the image quality requirements for verification.",
    validDocumentAppearance:
      "The presented document's appearance corresponds with how a valid document should appear.",
    physicalDocumentPresent:
      "The presented document is real and exists in the physical original form.",
    documentRecognised:
      "The presented identity document has successfully been recognized and the session can proceed with futher validation checks.",
    documentNotExpired:
      "The presented document has not expired and can be used for verification.",
  },
  biometric: {
    faceSimilarToPortrait: "The face in selfie matches the face in the document photo.",
    faceNotInBlocklist: "The face from the selfie is not on a face blocklist.",
    faceLiveness:
      "The selfie is of a real face that is physically present during the verification session.",
    faceImageAvailable:
      "The face image from the selfie is available for verification and can proceed with the face related checks.",
    faceImageQualitySufficient:
      "The face image from the selfie meets the image quality requirements for verification.",
  },
  fraud: {
    allowedIpLocation:
      "The user's device IP address is not from a restricted area and is therefore accepted.",
    expectedTrafficBehaviour:
      "The user and session behavior do not appear to be suspicious or as being part of a repetitive pattern related to fraud.",
  },
};

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
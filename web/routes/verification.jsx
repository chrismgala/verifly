import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { useFetch } from "@gadgetinc/react";

import { 
  Page,
  BlockStack,
  Card,
  DataTable, 
  Text, 
  ProgressBar,
  Spinner,
} from "@shopify/polaris";
import { InfoIcon } from '@shopify/polaris-icons';


import { FullPageError } from "../components/FullPageError";
import { displayVerificationBadge } from "./verifications";
import { capitalizeString, normalizeCamelCase } from "../util";

const INSIGHTS_MAP = {
  document: {
    documentAccepted: 'The presented document is accepted in the integration and the session can proceed with further validation checks.',
    documentFrontImageAvailable: 'The image of the front of the document is present and can be used for the verification.',
    documentFrontFullyVisible: 'The image of front of the document fully visible.',
    documentBackImageAvailable: 'The image of the back of the document is present and can be used for the verification.',
    documentBackFullyVisible: 'The image of back of the document fully visible.',
    documentImageQualitySufficient: 'The document image meets the image quality requirements for verification.',
    validDocumentAppearance: 'The presented document\'s appearance corresponds with how a valid document should appear.',
    physicalDocumentPresent: 'The presented document is real and exists in the physical original form.',
    documentRecognised: 'The presented identity document has successfully been recognized and the session can proceed with futher validation checks.',
    documentNotExpired: 'The presented document has not expired and can be used for verification.',
  },
  biometric: {
    faceSimilarToPortrait: 'The face in selfie matches the face in the document photo.',
    faceNotInBlocklist: 'The face from the selfie is not on a face blocklist.',
    faceLiveness: 'The selfie is of a real face that is physically present during the verification session.',
    faceImageAvailable: 'The face image from the selfie is available for verification and can proceed with the face related checks.',
    faceImageQualitySufficient: 'The face image from the selfie meets the image quality requirements for verification.',
  },
  fraud: {
    allowedIpLocation: 'The user\'s device IP address is not from a restricted area and is therefore accepted.',
    expectedTrafficBehaviour: 'The user and session behavior do not appear to be suspicious or as being part of a repetitive pattern related to fraud.',
  },
}

const CONFIDENCE_LEVEL_MAP = {
  high: '🟢',
  medium: '🟡',
  low: '🔴',
}

export const VerificationPage = () => {
  const { id, sessionId } = useParams();

  const navigate = useNavigate();

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

  // Process and transform data from Veriff
  const person = data?.person;
  const document = data?.document;
  const insights = data?.insights;
  const rawImages = data?.rawImages;
  const acceptanceTime = data?.acceptanceTime;
  const decisionScore = data?.decisionScore;
  const internalVerification = data?.internalVerification;

  // Transform person data into rows - use useMemo instead of useEffect
  const personalInfoRows = useMemo(() => {
    if (!person) return [];
    
    const rows = [];
    for (const detail in person) {
      if (person[detail] && person[detail].value) {
        rows.push([
          normalizeCamelCase(detail),
          person[detail].value,
          CONFIDENCE_LEVEL_MAP[person[detail].confidenceCategory],
          person[detail].sources.join(', ')
        ]);
      }
    }

    rows.sort((a, b) => a[0].localeCompare(b[0]));

    return rows;
  }, [person]);

  const documentInfoRows = useMemo(() => {
    if (!document) return [];
    
    const rows = [];
    for (const detail in document) {
      if (document[detail] && document[detail].value) {
        rows.push([
          normalizeCamelCase(detail),
          ...(detail === 'type' ? [normalizeDocumentType(document[detail].value)] : [document[detail].value]),
          CONFIDENCE_LEVEL_MAP[document[detail].confidenceCategory],
          ...document[detail].sources ? [document[detail].sources.join(', ')] : ['']
        ]);
      }
    }

    rows.sort((a, b) => a[0].localeCompare(b[0]));

    return rows;
  }, [document]);

  const insightsRows = useMemo(() => {
    if (!insights) return [];
    
    const rows = [];
    for (const insight of insights) {
      rows.push([
        capitalizeString(insight.category),
        INSIGHTS_MAP[insight.category][insight.label], 
        insight.result === 'yes' ? '✅' : '❌'
      ]);
    }

    rows.sort((a, b) => a[0].localeCompare(b[0]));

    return rows;
  }, [insights]);

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
  const isLoading = fetching ||isOverriding || overrideFetching;

  if (error) { console.error(error); }
  else if (!person && !fetching) {
    return (
      <FullPageError
        title="Error fetching verification details"
        message="Please refresh the page. If the problem persists, take a screenshot of this page and email it and your shop's name to support@verifly.shop."
      />
    );
  }
  
  return (
    <Page
      title="Verification"
      titleMetadata={displayVerificationBadge(currentStatus)}
      subtitle={`Completion date: ${acceptanceTime ? new Date(acceptanceTime).toString() : 'calculating...'}`}
      primaryAction={!isVerified ? { 
        content: 'Approve', 
        onAction: overrideVerification,
        loading: isLoading
      } : null}
      secondaryActions={[
        {
          content: '',
          icon: InfoIcon,
          disabled: true,
          helpText: `
            VIZ = Visual Inspection Zone, the printed data outside the MRZ. 
            MRZ = Machine Readable Zone, the encoded machine-readable lines containing document holder\'s data and forgery detection numbers. 
            BARCODE = Barcode, which includes formats like QR codes.
            NFC = Near Field Communication, which is a microchip in the document.
          `,
        },
      ]}
      backAction={{
        content: "Verifications",
        onAction: () => navigate("/verifications"),
      }}
    >
      <BlockStack gap="400">
        <Card>
          <Text as="h2" variant="headingSm">
            Personal Information
          </Text>

          {fetching ? (
            <Spinner size="large" />
          ) : (
            <DataTable
              columnContentTypes={[
                'text',
                'text',
                'text',
                'text',
              ]}
              headings={[
                'Field',
                'Data Extracted',
                'Confidence Level',
                'Sources',
              ]}
              rows={personalInfoRows}
            />
          )}
        </Card>

        <Card>
          <Text as="h2" variant="headingSm">
            Document Information
          </Text>

          {fetching ? (
            <Spinner size="large" />
          ) : (
            <DataTable
              columnContentTypes={[
                'text',
                'text',
                'text',
                'text',
              ]}
              headings={[
                'Field',
                'Data Extracted',
                'Confidence Level',
                'Sources',
              ]}
              rows={documentInfoRows}
            />
          )}
        </Card>

        <Card>
          <Text as="h2" variant="headingSm">
            Verification Insights
          </Text>

          {fetching ? (
            <Spinner size="large" />
          ) : (
            <>
              <div style={{ width: '25%', margin: '16px 0' }}>
                <Text as="h2" variant="headingSm">
                  Decision Score: {decisionScore * 100} / 100
                </Text>

                <ProgressBar 
                  progress={Math.round(decisionScore * 100)} 
                  tone={decisionScore > 0.5 ? "success" : "critical"} 
                />
              </div>

              <DataTable
                columnContentTypes={[
                  'text',
                  'text',
                  'text',
                ]}
                headings={[
                  'Category',
                  'Insight',
                  'Result'
                ]}
                rows={insightsRows}
              />
            </>
          )}
        </Card>

        <Card>
          <Text as="h2" variant="headingSm">
            Verification Images
          </Text>

          <div>
            {rawImages?.map((image, index) => (
              <img key={index} src={image} style={{ margin: '16px 0' }} />
            ))}
          </div>
        </Card>
      </BlockStack>
    </Page>
  );
}

const normalizeDocumentType = (type) => {
  switch (type) {
    case 'drivers_license': return 'Driver\'s License';
    case 'passport': return 'Passport';
    case 'id_card': return 'ID Card';
    case 'residence_permit': return 'Residence Permit';
    case 'other': return 'Other';
    default: return 'Unknown Document';
  }
}

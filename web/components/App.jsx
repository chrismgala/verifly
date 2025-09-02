import { useEffect } from "react";
import {
  Link,
  Outlet,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  useLocation,
  useNavigate
} from "react-router";
import {
  AppType,
  Provider as GadgetProvider,
  useGadget
} from "@gadgetinc/react-shopify-app-bridge";
import { NavMenu } from "@shopify/app-bridge-react";
import { useSession, useFindOne } from "@gadgetinc/react";

import { Card, Page, Spinner, Text } from "@shopify/polaris";

import { api } from "../api";
import { IndexPage } from "../routes/index";
import { BillingPage } from "../routes/billing";
import { VerificationsPage } from "../routes/verifications";
import { VerificationPage } from "../routes/verification";
import { ProductsPage } from "../routes/products";
import { SettingsPage } from "../routes/settings";
import { TestVerificationPage } from "../routes/test-verification";

import { FullPageError } from "../components/FullPageError";
import { FullPageSpinner } from "../components/FullPageSpinner";
import "./App.css";

function Error404() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const appURL = process.env.GADGET_PUBLIC_SHOPIFY_APP_URL;

    if (appURL && location.pathname === new URL(appURL).pathname) {
      navigate("/", { replace: true });
    }
  }, [location.pathname]);

  return (
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      <h3>404</h3>
      <p>Sorry this page doesn't exist</p>
      <a href="/">Return to the main page</a>
    </div>
  );
}

// Wire up routes
function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Layout />}>
        <Route index element={<IndexPage />} />
        <Route path="verifications" element={<VerificationsPage />} />
        <Route path="verification/:id/:sessionId" element={<VerificationPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="test-verification" element={<TestVerificationPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Error404 />} />
      </Route>
    )
  );

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

function Layout() {
  return (
    <GadgetProvider
      type={AppType.Embedded}
      shopifyApiKey={window.gadgetConfig.apiKeys.shopify}
      api={api}
    >
      <AuthenticatedApp />
    </GadgetProvider>
  );
}

// Only the show the app to merchants who have successfully completed OAuth
function AuthenticatedApp() {
  const { isAuthenticated, loading } = useGadget();
  
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          width: "100%",
        }}
      >
        <Spinner accessibilityLabel="Spinner example" size="large" />
      </div>
    );
  }
  return isAuthenticated ? <EmbeddedApp /> : <UnauthenticatedApp />;
}

function EmbeddedApp() {
  const { shopId } = useSession();

  const [{ data: shop, fetching, error }] = useFindOne(api.shopifyShop, shopId, {
    select: {
      id: true,
      name: true,
      shopOwner: true,
      monthlyVerificationCount: true,
      setupComplete: true,
      confirmationUrl: true,
      verificationsEnabled: true,
      testVerificationSent: true,
      triggerPrice: true,
      verificationFlow: true,
      logo: { 
        url: true
      },
      primaryColor: true,
      secondaryColor: true,
      emailDomain: true,
      domainRecords: true,
      domainId: true,
      veriflyPlan: {
        id: true,
        name: true,
        price: true,
      },
      myshopifyDomain: true,
    }
  });

  if (error || (!shop && !fetching)) {
    return (
      <FullPageError
        title="Error fetching shop details"
        message="Please refresh the page. If the problem persists, take a screenshot of this page and email it and your shop's name to support@verifly.shop."
      />
    );
  } else if (fetching && !shop) {
    return <FullPageSpinner />;
  }

  return (
    <>
      <Outlet context={{ shopId, shop }} />
        
      <NavMenu>
        <Link to="/" rel="home">
          Shop Information
        </Link>
        <Link to="/verifications" rel="verifications">
          🔐 Verifications
        </Link>
        <Link to="/products" rel="products">
          🛍️ Products
        </Link>
        <Link to="/test-verification" rel="test-verification">
          🧪 Test Verification
        </Link>
        <Link to="/billing" rel="billing">
          🏦 Billing
        </Link>
        <Link to="/settings" rel="settings">
          ⚙️ Settings
        </Link>
      </NavMenu>
    </>
  );
}

function UnauthenticatedApp() {
  return (
    <Page>
      <div style={{ height: "80px" }}>
        <Card padding="500">
          <Text variant="headingLg" as="h1">
            App must be viewed in the Shopify Admin
          </Text>
        </Card>
      </div>
    </Page>
  );
}

export default App;

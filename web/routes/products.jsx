import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from "react-router";
import { SaveBar, useAppBridge } from "@shopify/app-bridge-react";
import { useFetch } from "@gadgetinc/react";

import { 
  Page,
  Banner,
  Card,
  Layout,
  Text,
  Spinner,
  EmptyState,
  OptionList,
  Badge
} from "@shopify/polaris";

export const ProductsPage = () => {
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const { shopId, shop } = useOutletContext();

  const isTrialActivated = shop?.confirmationUrl && shop?.veriflyPlan;

  // State for products and selections
  const [selectedProductVariants, setSelectedProductVariants] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch products from our backend
  const [{ data: productsData, fetching: fetchingProducts, error: productsError }, fetchProducts] = useFetch(`/products/${shopId}`, {
    method: "GET",
    json: true
  });

  // Update products endpoint
  const [{ data: updateData, fetching: updating, error: updateError }, updateProducts] = useFetch(`/products/${shopId}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    }
  });

  if (productsError) { console.error(productsError); }
  const products = productsData?.products;

  // Load products on component mount
  useEffect(() => {
    if (isTrialActivated) {
      void fetchProducts();
    }
  }, [isTrialActivated]);

  // Initial products
  useEffect(() => {
    if (products) {
      // Initialize selected products based on needsVerification for both products and variants
      const initialSelected = [];
      products.forEach(product => {        
        // Check if any variants need verification
        product.variants.forEach(variant => {
          if (variant.needsVerification) {
            initialSelected.push(variant.id);
          }
        });
      });
      setSelectedProductVariants(initialSelected);
    }
  }, [products]);

  // Handle save
  const handleSave = async () => {
    const productVariantsToUpdate = products.variants.map(variant => ({
      id: variant.id,
      needsVerification: selectedProductVariants.includes(variant.id)
    }));

    await updateProducts({
      body: JSON.stringify({ productVariants: productVariantsToUpdate })
    });

    setHasChanges(false);
    shopify.saveBar.hide('products-save-bar');
  };

  // Handle discard
  const handleDiscard = () => {
    // Reset to original state
    const originalSelected = [];
    products.variants.forEach(variant => {
      if (variant.needsVerification) {
        originalSelected.push(variant.id);
      }
    });
    setSelectedProductVariants(originalSelected);
    setHasChanges(false);
    shopify.saveBar.hide('products-save-bar');
  };

  // Show save bar when there are changes
  useEffect(() => {
    if (hasChanges) {
      shopify.saveBar.show('products-save-bar');
    }
  }, [hasChanges]);

  // Handle successful update
  useEffect(() => {
    if (updateData && !updating) {
      // Refresh products to get updated data
      void fetchProducts();
    }
  }, [updateData, updating]);

  // Format product data for OptionList
  const formatProductOptions = (products) => {
    if (!products) return [];
    
    return products.map(product => {
      // Create options for variants
      const variantOptions = product.variants.map(variant => ({
        value: variant.id,
        label: variant.title,
      }));
      
      return {
        title: product.title,
        options: variantOptions,
      };
    });
  };

  return (
    <Page
      title="Products"
      subtitle="If you don't see a product here, check its status in the Shopify Admin > Products."
      backAction={{
        content: "Shop Information",
        onAction: () => navigate("/"),
      }}
    >
      <SaveBar id="products-save-bar">
        <button variant="primary" onClick={handleSave} disabled={updating}>
          {updating ? 'Saving...' : 'Save'}
        </button>
        <button onClick={handleDiscard} disabled={updating}>
          Discard
        </button>
      </SaveBar>

      <Layout>
        <Layout.Section>
          {!isTrialActivated && (
            <Banner 
              title="Your trial needs to be activated"
              tone="warning"
              action={{ content: 'Activate trial', url: shop?.confirmationUrl }}
            >
              <Text as="p" variant="bodyMd">
                Activating your free trial will allow you to choose which products will require ID verification.
              </Text>
            </Banner>
          )}

          {updateError && (
            <Banner 
              title="Error saving changes"
              tone="critical"
            >
              <Text as="p" variant="bodyMd">
                {updateError.message || 'An error occurred while saving your changes. Please try again.'}
              </Text>
            </Banner>
          )}
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{ padding: '16px' }}>
              <Text variant="headingMd" as="h2">
                Select Products
              </Text>
              <Text as="p" variant="bodyMd" style={{ marginTop: '8px' }}>
                Choose which products will require ID verification from new customers. 
                Only selected products will trigger verification requests.
              </Text>
            </div>

            {fetchingProducts ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <Spinner accessibilityLabel="Loading products" size="large" />
                <div style={{ marginTop: '16px' }}>
                  <Text variant="bodyMd">Loading your products...</Text>
                </div>
              </div>
            ) : products && products.length === 0 ? (
              <EmptyState
                heading="No products found"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <Text as="p" variant="bodyMd">
                  No products were found in your Shopify store. Products will appear here once they are created in your Shopify Admin.
                </Text>
              </EmptyState>
            ) : products && products.length > 0 && (
              <OptionList
                allowMultiple
                sections={formatProductOptions(products)}
                selected={selectedProductVariants}
                onChange={setSelectedProductVariants}
              />
            )}

            {products && products.length > 0 && (
              <div style={{ padding: '16px', borderTop: '1px solid #e1e3e5' }}>
                <Text variant="bodyMd">
                  <strong>{selectedProductVariants.length}</strong> of <strong>{products && products.variants.length}</strong> variants selected for verification
                </Text>
              </div>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}; 
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
  Checkbox,
  Button,
  Spinner,
  EmptyState,
  ResourceList,
  ResourceItem,
  Badge
} from "@shopify/polaris";

export const ProductsPage = () => {
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const { shopId, shop } = useOutletContext();

  const isTrialActivated = shop?.confirmationUrl && shop?.veriflyPlan;

  // State for products and selections
  const [selectedProducts, setSelectedProducts] = useState(new Set());
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
      // Initialize selected products based on needsVerification
      const initialSelected = new Set();
      products.forEach(product => {
        if (product.needsVerification) {
          initialSelected.add(product.id);
        }
      });
      setSelectedProducts(initialSelected);
    }
  }, [products]);

  // Handle product selection
  const handleProductToggle = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
    setHasChanges(true);
  };

  // Handle save
  const handleSave = async () => {
    const productsToUpdate = products.map(product => ({
      id: product.id,
      needsVerification: selectedProducts.has(product.id)
    }));

    await updateProducts({
      body: JSON.stringify({ products: productsToUpdate })
    });

    setHasChanges(false);
    shopify.saveBar.hide('products-save-bar');
  };

  // Handle discard
  const handleDiscard = () => {
    // Reset to original state
    const originalSelected = new Set();
    products.forEach(product => {
      if (product.needsVerification) {
        originalSelected.add(product.id);
      }
    });
    setSelectedProducts(originalSelected);
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

  const renderProductItem = (product) => {
    const isSelected = selectedProducts.has(product.id);
    
    return (
      <ResourceItem
        id={product.id}
        onClick={() => handleProductToggle(product.id)}
      >
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <div style={{ marginRight: '12px' }}>
            <Checkbox
              checked={isSelected}
              onChange={() => handleProductToggle(product.id)}
              disabled={!isTrialActivated}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Text variant="bodyMd" fontWeight="bold">
              {product.title}
            </Text>
            <div style={{ marginTop: '4px' }}>
              <Text tone="subdued">
                {product.vendor && `${product.vendor} • `}
                {product.productType || 'No type'}
              </Text>
            </div>
            <div style={{ marginTop: '4px' }}>
              <Badge tone={product.status.toUpperCase() === 'ACTIVE' ? 'success' : 'attention'}>
                {product.status}
              </Badge>
            </div>
          </div>
        </div>
      </ResourceItem>
    );
  };

  return (
    <Page
      title="Products"
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
              <ResourceList
                items={products}
                renderItem={renderProductItem}
                loading={fetchingProducts}
              />
            )}

            {products && products.length > 0 && (
              <div style={{ padding: '16px', borderTop: '1px solid #e1e3e5' }}>
                <Text variant="bodyMd">
                  <strong>{selectedProducts.size}</strong> of <strong>{products && products.length}</strong> products selected for verification
                </Text>
              </div>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}; 
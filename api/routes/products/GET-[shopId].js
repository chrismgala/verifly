import { RouteHandler } from "gadget-server";

/**
 * Route handler for fetching and syncing products
 *
 * @type { RouteHandler } route handler - see: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = async ({ request, reply, api, logger, connections }) => {
  try {
    const shopId = request.params.shopId;
    
    // Get the shop to access Shopify API credentials
    const shop = await api.shopifyShop.findById(shopId);
    if (!shop) {
      return reply.code(404).send({ error: "Shop not found" });
    }

    const shopify = connections.shopify.current;
    if (!shopify) {
      throw new Error("Missing Shopify connection");
    };

    const result = await shopify.graphql(
      `query ($first: Int!) {
        products(first: $first) {
          edges {
            node {
              id
              title
              handle
              status
              vendor
              productType
              tags
              publishedAt
              createdAt
              updatedAt
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }`, 
      {
        first: 250
      }
    );

    const products = result.products.edges.map(edge => edge.node);
    const transformedProducts = [];

    // Process each product and sync with our database
    for (const shopifyProduct of products) {
      try {
        // Extract Shopify ID from the GraphQL ID (gid://shopify/Product/123456789)
        const shopifyProductId = shopifyProduct.id.split('/').pop();
        
        // Check if product exists in our database
        let existingProduct = await api.shopifyProduct.findById(shopifyProductId);

        if (!existingProduct) {
          // Create new product in our database
          existingProduct = await api.shopifyProduct.create({
            id: shopifyProductId,
            title: shopifyProduct.title,
            handle: shopifyProduct.handle,
            status: shopifyProduct.status,
            vendor: shopifyProduct.vendor,
            productType: shopifyProduct.productType,
            tags: shopifyProduct.tags,
            publishedAt: shopifyProduct.publishedAt,
            shopifyCreatedAt: shopifyProduct.createdAt,
            shopifyUpdatedAt: shopifyProduct.updatedAt,
            needsVerification: false,
            shop: {
              _link: shopId
            }
          });
        } else {
          // Update existing product with latest data
          await api.shopifyProduct.update(existingProduct.id, {
            shopifyProduct: {
              title: shopifyProduct.title,
              handle: shopifyProduct.handle,
              status: shopifyProduct.status,
              vendor: shopifyProduct.vendor,
              productType: shopifyProduct.productType,
              tags: shopifyProduct.tags,
              publishedAt: shopifyProduct.publishedAt,
              shopifyUpdatedAt: shopifyProduct.updatedAt
            }
          });
        }

        // Add to transformed products array
        transformedProducts.push({
          id: shopifyProductId,
          title: existingProduct.title,
          handle: existingProduct.handle,
          status: existingProduct.status,
          vendor: existingProduct.vendor,
          productType: existingProduct.productType,
          needsVerification: existingProduct.needsVerification
        });

      } catch (error) {
        logger.error({ error, productId: shopifyProduct.id, shopId }, 'Failed to process product');
      }
    }

    // Sort products by title
    transformedProducts.sort((a, b) => a.title.localeCompare(b.title));

    return reply.code(200).send({ products: transformedProducts });

  } catch (error) {
    logger.error({ error, shopId }, 'Failed to fetch products');
    return reply.code(500).send({ error: "Failed to fetch products" });
  }
};

export default route; 
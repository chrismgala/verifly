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
      logger.error({ shopId }, 'Shopify connection not available');
      return reply.code(503).send({ error: "Shopify connection unavailable" });
    }

    const result = await shopify.graphql(
      `query ($first: Int!) {
        products(first: $first) {
          edges {
            node {
              id
              title
              handle
              status
              tags
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                  }
                }
              }
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

    const products = result.products.edges.filter(edge => edge.node.status === 'ACTIVE').map(edge => edge.node);
    const transformedProducts = [];

    // Process each product and sync with our database
    for (const shopifyProduct of products) {
      try {
        // Extract Shopify ID from the GraphQL ID (gid://shopify/Product/123456789)
        const shopifyProductId = shopifyProduct.id.split('/').pop();
        
        // Check if product exists in our database
        let existingProduct = await api.shopifyProduct.maybeFindById(shopifyProductId);

        if (!existingProduct) {
          // Create new product in our database
          existingProduct = await api.shopifyProduct.create({
            id: shopifyProductId,
            title: shopifyProduct.title,
            handle: shopifyProduct.handle,
            status: shopifyProduct.status,
            tags: shopifyProduct.tags,
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
              tags: shopifyProduct.tags,
            }
          });
        }

        // Now process the variants in case the merchant only needs ID for certain ones
        const variants = shopifyProduct.variants.edges.map(edge => edge.node);
        let internalVariants = [];

        for (const variant of variants) {
          const variantId = variant.id.split('/').pop();
          let existingVariant = await api.shopifyProductVariant.maybeFindById(variantId);
          
          if (!existingVariant) {
            // Create new variant in our database
            existingVariant = await api.shopifyProductVariant.create({
              id: variantId,
              title: variant.title,
              product: {
                _link: existingProduct.id
              }
            });
          } else {
            // Update existing variant with latest data
            await api.shopifyProductVariant.update(existingVariant.id, {
              title: variant.title,
            });
          }

          internalVariants.push(existingVariant);
        }

        // Add to transformed products array
        transformedProducts.push({
          id: existingProduct.id,
          title: existingProduct.title,
          handle: existingProduct.handle,
          status: existingProduct.status,
          tags: existingProduct.tags,
          needsVerification: existingProduct.needsVerification,
          variants: internalVariants.map(variant => ({
            id: variant.id,
            title: variant.title,
            needsVerification: variant.needsVerification
          }))
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
import { Resend } from 'resend';

import { URL } from "url";

import VerificationEmail from '../../web/components/VerificationEmail/VerificationEmail';
import { createVerificationSession } from '../helpers/veriff';

/** @type { ActionRun } */
export const run = async ({ trigger, logger, api }) => {
  // access order payload attributes at trigger.payload.id
  // access the topic at trigger.topic
  const isShopifyTrigger = trigger.type === "shopify_webhook";

  const order = trigger.payload;

  const orderId = order.id;
  const orderName = order.name;
  const orderStatusUrl = new URL(order.order_status_url);
  const shopId = orderStatusUrl.pathname.split('/')[1];

  // Proper access of customer data which is nested in the order
  const customer = order.customer || {};
  const customerFirstName = customer.first_name || '';
  const customerLastName = customer.last_name || '';
  const customerEmail = customer.email;

  if (isShopifyTrigger) {
    logger.info(
      {
        orderId,
        orderName,
        customerId: customer?.id,
        topic: trigger.topic,
      },
      "Received Shopify order creation webhook"
    );

    try {
      // Order doesn't exist, create a new record
      const newOrder = await api.shopifyOrder.create({
        id: orderId,
        name: orderName,
        totalPrice: order.total_price,
        shop: order.shop,
        shippingAddress: order.shipping_address,
        billingAddress: order.billing_address,
        orderStatusUrl: order.order_status_url,
        // Reference the customer using _link syntax
        customer: {
          _link: customer?.id // This is the ID of the shopifyCustomer where shopifyCustomer is the parent record
        }
      });

      logger.info(
        { orderId, orderName: order.name },
        "Created new order record from webhook"
      );

      // Create the customer as well so we can track verification status and follow up accordingly
      const newOrUpdatedCustomer = await api.shopifyCustomer.upsert({
        on: ['platformCustomerId'],
        platformCustomerId: order.customer?.id,
        email: customerEmail,
        firstName: customerFirstName,
        lastName: customerLastName,
        // Reference the shop using _link syntax
        shop: {
          _link: shopId // This is the ID of the shopifyShop where shopifyShop is the parent record
        }
      });

      logger.info(
        { newOrUpdatedCustomer },
        "Upserted new customer record from webhook"
      );
      
      return newOrder;
    } catch (error) {
      logger.error(
        {
          error,
          orderId: trigger.payload.id,
          orderName: trigger.payload.name,
          topic: trigger.topic
        },
        "Error saving order or customer data from webhook"
      );
      throw error;
    }
  }
};

/** @type { ActionOnSuccess } */
export const onSuccess = async ({ trigger, logger, api }) => {
  const isShopifyTrigger = trigger?.type === "shopify_webhook";

  if (isShopifyTrigger) {
    // Transform the payload and properly access nested customer data
    const order = trigger.payload;

    // Extract customer data safely with fallbacks
    const orderStatusUrl = new URL(order.order_status_url);
    const orderNumber = order.name; // This includes the '#', whereas order_number doesn't
    const orderPrice = order.total_price;

    const shopId = orderStatusUrl.pathname.split('/')[1];
    const shop = await api.shopifyShop.maybeFindOne(shopId);
    const shopName = shop?.name || '';
    
    const customer = await api.shopifyCustomer.maybeFindFirst({
      filter: {
        platformCustomerId: { equals: order.customer?.id }
      }
    });

    const customerFirstName = customer?.firstName || '';
    const customerLastName = customer?.lastName || '';
    const customerName = customerFirstName ?
      `${customerFirstName} ${customerLastName}`.trim() :
      'Customer';
    const customerEmail = customer?.email;

    const productsNeedingVerification = await api.shopifyProduct.findMany({
      filter: {
        shopId: {
          equals: shopId
        },
        needsVerification: true
      },
      select: {
        id: true
      }
    });

    const productIdsFromOrder = order.line_items.map(lineItem => lineItem.product_id);
    const productsToVerify = productsNeedingVerification.filter(product => productIdsFromOrder.includes(product.id));

    logger.info(
      {
        orderId: order.id,
        orderName: order.name,
        topic: trigger.topic,
        success: true
      },
      "Order creation action completed successfully"
    );

    // Only proceed if we have a customer email
    if (!customerEmail) {
      logger.warn(
        { orderId: order.id },
        "Abort verification email - no customer email found"
      );
      return;
    }

    if (customer.status === 'approved') {
      logger.info(
        { orderId: order.id, customerEmail },
        "Abort verification email - customer is already approved"
      );
      return;
    }

    if (!shop?.verificationsEnabled) {
      logger.warn(
        { orderId: order.id, shopId },
        "Abort verification email - verifications are disabled for this shop"
      );
      return;
    }

    if (orderPrice < shop.triggerPrice) {
      logger.warn(
        { orderId: order.id, customerEmail, orderPrice, shopTriggerPrice: shop.triggerPrice },
        "Abort verification email - order price is below trigger price"
      );
      return;
    }

    if (productsToVerify.length === 0) {
      logger.warn(
        { orderId: order.id, customerEmail, productsToVerify },
        "Abort verification email - no products need verification"
      );
      return;
    }

    try {
      // Send verification email
      const resend = new Resend(process.env.RESEND_API_KEY);

      // Create the verification immediately so merchants can see verifications in progress
      const internalVerification = await api.verification.create({
        status: 'pending',
        shop: {
          _link: shopId
        },
        customer: {
          _link: order.customer?.id
        },
        order: {
          _link: order.id
        }
      });

      logger.info({ customer, order }, "Created new verification record");

      const veriffVerification = await createVerificationSession({
        verification: {
          person: {
            firstName: customerFirstName,
            lastName: customerLastName,
            email: customerEmail,
          },
          vendorData: internalVerification.id
        },
      });

      const { verification } = veriffVerification;
      const { url } = verification;

      // Add in sessionId for future retrieval using Veriff endpoints
      await api.verification.update(internalVerification.id, {
        sessionId: verification.id,
      });

      const { data, error } = await resend.emails.send({
        from: 'Verifly <info@verifly.shop>',
        to: customerEmail,
        subject: `[Action required] Verify your identity`,
        react: VerificationEmail({
          shopName,
          customerName,
          orderNumber,
          url
        })
      });

      if (error) {
        logger.error({ error }, "Error sending verification email");
        return;
      }

      logger.info({ emailId: data?.id }, "Verification email sent successfully");

      await api.verification.update(internalVerification.id, {
        emailId: data?.id
      });

    } catch (error) {
      logger.error(
        {
          error,
          orderId: order.id,
          orderName: order.name,
          topic: trigger.topic
        },
        "Error creating verification or sending email"
      );
      throw error;
    }
  }
};

export const options = {
  triggers: {
    shopify: { webhooks: ["orders/create"] },
  },
};
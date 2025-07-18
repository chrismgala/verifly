import { Resend } from 'resend';
import Stripe from 'stripe';

import { URL } from "url";

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
    const shop = await api.shopifyShop.maybeFindFirst({
      filter: {
        id: { equals: shopId }
      }
    });
    const shopName = shop?.name || '';
    
    const customer = await api.shopifyCustomer.maybeFindFirst({
      filter: {
        platformCustomerId: { equals: order.customer?.id }
      }
    });

    const customerFirstName = customer.first_name || '';
    const customerLastName = customer.last_name || '';
    const customerName = customerFirstName ?
      `${customerFirstName} ${customerLastName}`.trim() :
      'Customer';
    const customerEmail = customer.email;

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

    if (customer.status === 'verified') {
      logger.info(
        { orderId: order.id, customerEmail },
        "Abort verification email - customer is already verified"
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

    if (!shop.triggerPrice || orderPrice < shop.triggerPrice) {
      logger.warn(
        { orderId: order.id, customerEmail },
        "Abort verification email - order price is below trigger price"
      );
      return;
    }

    try {
      // Send verification email
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const resend = new Resend(process.env.RESEND_API_KEY);

      // Create the session.
      const stripeVerificationSession = await stripe.identity.verificationSessions.create({
        type: 'document',
        provided_details: {
          email: customerEmail,
        },
        metadata: {
          customer_id: order.customer?.id,
          shop_id: shopId,
          order_id: order.id
        },
      });

      // Create the verification immediately so merchants can see verifications in progress
      const newVerification = await api.verification.create({
        sessionId: stripeVerificationSession.id,
        status: stripeVerificationSession.status,
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

      logger.info({ newVerification, shop, customer, order }, "Created new verification record");

      const stripeVerificationUrl = stripeVerificationSession.url;

      const { data, error } = await resend.emails.send({
        from: 'Verifly <info@verifly.shop>',
        to: customerEmail,
        subject: `[Action required] Complete verification to avoid delays in shipping your ${shopName} order`,
        html: `
          <h2>Please Verify Yourself With ${shopName}</h2>
          
          <p>Hey there ${customerName},</p>
          
          <p>
            Your Order ${orderNumber} for ${shopName} has been received. However, ID verification is required to approve fulfillment of your order.
          </p>
          
          <p>Please click below to verify your information:</p>

          <a href="${stripeVerificationUrl}" target="_blank">Verify Now</a>
        `
      });

      if (error) {
        logger.error({ error }, "Error sending verification email");
        return;
      }

      logger.info({ emailId: data?.id }, "Verification email sent successfully");

    } catch (error) {
      logger.error(
        {
          error,
          orderId: order.id,
          orderName: order.name,
          topic: trigger.topic
        },
        "Error sending verification email"
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
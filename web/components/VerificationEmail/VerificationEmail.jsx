import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Img,
  Heading,
  Text,
  Button,
  Hr,
  Tailwind,
} from '@react-email/components';

const VerificationEmail = ({ 
  shopName, 
  customerName, 
  orderNumber, 
  url,
  logo = null,
  primaryColor = null,
  secondaryColor = null,
  test = false
}) => {

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Body className="bg-[#0a0c10] font-sans py-[40px]">
          <Container className={`bg-[${primaryColor ? primaryColor : '#181a20'}] max-w-[600px] mx-auto rounded-[12px] overflow-hidden`}>
            {/* Header with Logo */}
            <Section className={`bg-[${primaryColor ? primaryColor : '#181a20'}] px-[32px] pt-[32px] pb-[24px] text-center`}>
              <Img
                src={logo ? logo.url : 'https://verifly.shop/logo-transparent.png'}
                alt={logo ? shopName : 'Verifly'}
                className="w-[120px] h-auto mx-auto"
              />
            </Section>

            {/* Main Content */}
            <Section className="px-[32px] pb-[32px]">
              <Heading className="text-[#fff] text-[24px] font-bold mb-[16px] text-center">
                {test ? 'Test Verification' : 'Verification Required'}
              </Heading>
              
              <Text className="text-[#fff] text-[16px] leading-[24px] mt-[24px] mb-[24px]">
                Hello {customerName},
              </Text>

              <Text className="text-[#fff] text-[16px] leading-[24px] mb-[24px]">
                Thank you for your recent order {orderNumber}. To ensure the security of your purchase, {shopName} has partnered with Verifly & Veriff to verify your identity before they can process and ship your order.
              </Text>

              <Text className="text-[#fff] text-[16px] leading-[24px] mb-[32px]">
                This verification process is quick, secure, and helps {shopName} comply with local regulations. Your personal information is encrypted and handled with the highest level of security.
              </Text>

              {/* CTA Button */}
              <Section className="text-center mb-[32px]">
                <Button
                  href={url}
                  className={`bg-[${secondaryColor ? secondaryColor : '#ed733e'}] text-white px-[32px] py-[16px] rounded-[8px] text-[16px] font-semibold no-underline box-border inline-block`}
                >
                  Verify Your Identity
                </Button>
              </Section>

              <Text className="text-[#fff] text-[14px] leading-[20px] mb-[24px] text-center">
                This verification typically takes 1 minute to complete.
              </Text>

              <Hr className="border-[#333] my-[24px]" />

              <Text className="text-[#fff] text-[16px] leading-[24px] mb-[16px] font-semibold">
                What happens next?
              </Text>

              <Text className="text-[#fff] text-[14px] leading-[20px] mb-[12px]">
                • Complete the secure verification process
              </Text>
              <Text className="text-[#fff] text-[14px] leading-[20px] mb-[12px]">
                • Your order will be processed shortly after
              </Text>
              <Text className="text-[#fff] text-[14px] leading-[20px] mb-[24px]">
                • You'll receive tracking information once shipped
              </Text>

              <Text className="text-[#fff] text-[14px] leading-[20px] mb-[24px]">
                If you have any questions about this verification process or need assistance, please don't hesitate to contact {shopName}.
              </Text>
            </Section>

            {/* Footer */}
            <Hr className="border-[#333] mx-[32px]" />
            <Section className="px-[32px] py-[24px] text-center">
              <Text className="text-[#999] text-[12px] leading-[16px] m-0">
                © {new Date().getFullYear()} {shopName}. All rights reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default VerificationEmail;
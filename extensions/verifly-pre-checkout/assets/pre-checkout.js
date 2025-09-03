(async function () {
  const veriff = Veriff({
    host: 'https://stationapi.veriff.com',
    apiKey: 'c747ff64-8a12-4ba6-844a-ae5678282caf',
    parentId: 'veriff-root',
    onSession: function(err, response) {
      window.veriffSDK.createVeriffFrame({
        url: response.verification.url,
        onEvent: function (message) {
          console.debug(`Veriff InContext SDK event: ${message}`);

          switch (message) {
            case 'FINISHED':
              const veriflyVerificationButton = document.getElementById("verifly-verification-trigger");
              const checkoutButton = document.querySelector("button[type='submit']#checkout");

              veriflyVerificationButton.style.display = 'none'; // Hide the verification button
              checkoutButton.style.display = 'block'; // Show the checkout button
              checkoutButton.disabled = false; // Enable the checkout button
              break;
            default:
          }
        }
      });
    }
  });

  veriff.setParams({
    person: {
      givenName: ' ',
      lastName: ' '
    }
  });

  /**
   * Fetches the variants needing verification for the shop.
   * 
   * @param {number[]} variantsInCart - The variant IDs in the cart.
   * @returns {Promise<Object>} - The variants needing verification.
   */
  async function fetchVariantsNeedingVerification(variantsInCart) {
    const response = await fetch(`${window.shopURL}/apps/proxy/variants/${window.shopId}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        variantsInCart
      })
    });
    return await response.json();
  }

  /**
   * Checks the verification status using their token.
   * 
   * @param {string} userToken - The user token to check the verification status for.
   */
  async function checkIfAlreadyVerified(userToken) {
    try {
      const response = await fetch(`${window.shopURL}/apps/proxy/verification/${window.shopId}/status`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          userToken
        })
      });

      return await response.json();
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Process a customer's email for verification. This should only be needed 
   * on the first checkout attempt. Once the customer has a record in our DB, 
   * we can use the `checkIfAlreadyVerified` function with their token to see
   * if they were approved by Veriff.
   * 
   * @param {string} email - The email to check the verification status for.
   */
  async function processEmailForVerification(email) {
    try {
      const response = await fetch(`${window.shopURL}/apps/proxy/verification/${window.shopId}/${encodeURIComponent(email)}`, {
        method: "GET",
        headers: {
          "content-type": "application/json",
        }
      });
      return await response.json();
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Uses Shopify's Cart Ajax API to get the items in the cart.
   * 
   * @returns {Promise<Object>} - The cart data.
   */
  async function fetchCart() {
    const response = await fetch('/cart.js');
    return await response.json();
  }

  document.addEventListener("DOMContentLoaded", async function () {
    const checkoutButton = document.querySelector("button[type='submit']#checkout");
    if (!checkoutButton) {
      console.error('No checkout button found');
      return;
    }

    checkoutButton.disabled = true;

    const cart = await fetchCart();
    const variantsInCart = cart.items.map(item => item.variant_id.toString());

    const { variantIds } = await fetchVariantsNeedingVerification(variantsInCart);
    const orderRequiresVerification = variantIds.length > 0;

    const userToken = localStorage.getItem('verifly_t');
    let userAlreadyVerified = false;
    if (userToken) {
      const { status } = await checkIfAlreadyVerified(userToken);
      userAlreadyVerified = status === 'approved';
    }

    if (!userAlreadyVerified && orderRequiresVerification) {
      const body = document.body;
      const cartCTAs = document.querySelector("div.cart__ctas");

      const veriflyVerificationButton = document.getElementById("verifly-verification-trigger");
      const veriflyStatusTrigger = document.getElementById("verifly-status-trigger");
      
      const veriffModal = document.getElementById("veriff-modal");
      const veriffModalClose = document.getElementById("veriff-modal-close");
      
      const veriffRoot = document.getElementById("veriff-root");
      const veriffDescription = document.getElementById("veriff-description");

      // Prepare the DOM ahead of time with elements from our liquid block
      cartCTAs.appendChild(veriflyVerificationButton);
      body.appendChild(veriffModal);

      // Immediately replace the checkout button
      checkoutButton.style.display = 'none';
      veriflyVerificationButton.style.display = 'block';

      // Open our modal which will lead to Veriff modal
      veriflyVerificationButton.addEventListener("click", async (event) => {
        veriff.mount({
          formLabel: {
            vendorData: 'Email',
          },
          submitBtnText: 'Start Verification',
          loadingText: 'Please wait...'
        });

        const veriffForm = veriffRoot.querySelector("form.veriff-container");
        const veriffEmailInput = veriffRoot.querySelector("input[id='veriff-vendor-data']");
        const veriffSubmitButton = veriffRoot.querySelector("input[id='veriff-submit-btn']");

        veriffRoot.prepend(veriffModalClose);
        veriffForm.appendChild(veriflyStatusTrigger);
        veriffRoot.appendChild(veriffDescription);

        // Intercept the Veriff mount and enable checking the customer's status first
        veriffSubmitButton.style.display = 'none';
        veriflyStatusTrigger.style.display = 'inline-block';

        veriffModal.style.display = 'flex';
        veriffModal.style.alignItems = 'center';
        veriffModal.style.justifyContent = 'center';

        veriffEmailInput.type = 'email';
      });

      // Handle closing our modal
      veriffModalClose.addEventListener("click", () => {
        veriffModal.style.display = 'none';
      });

      // Handle status check
      veriflyStatusTrigger.addEventListener("click", async (event) => {
        const veriffEmailInput = veriffRoot.querySelector("input[id='veriff-vendor-data']");

        // Validate email input
        const validityState = veriffEmailInput.validity;

        if (validityState.valueMissing) {
          veriffEmailInput.setCustomValidity('Please enter an email address');
        } else if (validityState.typeMismatch) {
          veriffEmailInput.setCustomValidity('Please enter a valid email address');
        } else {
          veriffEmailInput.setCustomValidity('');
        }

        veriffEmailInput.reportValidity();

        if (validityState.valid) {
          const email = veriffEmailInput.value;
            
          try {
            const { status, userToken } = await processEmailForVerification(email);
            
            localStorage.setItem('verifly_t', userToken);

            if (status === 'approved') { 
              veriffModal.style.display = 'none'; // Close our modal
              checkoutButton.disabled = false; // Enable the checkout button
              checkoutButton.click(); // Auto-advance the customer to checkout
            } else { // Proceed with Veriff flow
              const veriffSubmitButton = veriffRoot.querySelector("input[id='veriff-submit-btn']");
              veriffSubmitButton.click();
              veriffModal.style.display = 'none'; // Close our modal
            }
          } catch (error) {
            console.error(error);
          }
        }
      });
    } else {
      checkoutButton.disabled = false;
    }
  });
})();
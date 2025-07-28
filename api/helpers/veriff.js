const crypto = require("crypto");

export const createVerificationSession = async (payload) => {
  try {
    const headers = {
      "x-auth-client": process.env.VERIFF_API_KEY,
      "content-type": "application/json",
    };

    const options = {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    };
    const response = await fetch(`${process.env.VERIFF_API_URL}/sessions`, options);
    return await response.json();

  } catch (error) {
    throw new Error('Failed to create Veriff verification session');
  }
};

export const getSessionDecision = async (sessionId) => {
  try {
    const headers = {
      "x-auth-client": process.env.VERIFF_API_KEY,
      "x-hmac-signature": generateSignature(sessionId, process.env.VERIFF_SECRET_KEY),
      "content-type": "application/json",
    };

    const options = {
      method: "GET",
      headers: headers,
    };
    const response = await fetch(`${process.env.VERIFF_API_URL}/sessions/${sessionId}/decision`, options);
    return await response.json();

  } catch (error) {
    throw new Error('Failed to retrieve Veriff verification decision');
  }
};

export const getSessionPerson = async (sessionId) => {
  try {
    const headers = {
      "x-auth-client": process.env.VERIFF_API_KEY,
      "x-hmac-signature": generateSignature(sessionId, process.env.VERIFF_SECRET_KEY),
      "content-type": "application/json",
    };

    const options = {
      method: "GET",
      headers: headers,
    };
    const response = await fetch(`${process.env.VERIFF_API_URL}/sessions/${sessionId}/person`, options);
    return await response.json();

  } catch (error) {
    throw new Error('Failed to retrieve Veriff verification person');
  }
};

export const getSessionMedia = async (sessionId) => {
  try {
    const headers = {
      "x-auth-client": process.env.VERIFF_API_KEY,
      "x-hmac-signature": generateSignature(sessionId, process.env.VERIFF_SECRET_KEY),
      "content-type": "application/json",
    };

    const options = {
      method: "GET",
      headers: headers,
    };
    const response = await fetch(`${process.env.VERIFF_API_URL}/sessions/${sessionId}/media`, options);
    return await response.json();

  } catch (error) {
    throw new Error('Failed to retrieve Veriff verification media');
  }
};

export const getSessionImage = async (imageId, imageUrl) => {
  try {
    const headers = {
      "x-auth-client": process.env.VERIFF_API_KEY,
      "x-hmac-signature": generateSignature(imageId, process.env.VERIFF_SECRET_KEY),
      "content-type": "application/json",
    };

    const options = {
      method: "GET",
      headers: headers,
    };
    const response = await fetch(imageUrl, options);
    
    // Return the raw image data as a buffer
    return await response.arrayBuffer();
  } catch (error) {
    throw new Error('Failed to retrieve Veriff verification image');
  }
};

export const generateSignature = (payload, secret) => {
  if (payload.constructor === Object) {
    payload = JSON.stringify(payload);
  }

  if (payload.constructor !== Buffer) {
    payload = Buffer.from(payload, "utf8");
  }

  const signature = crypto.createHmac("sha256", secret);
  signature.update(payload);

  return signature.digest("hex");
}

export const isSignatureValid = (data) => {
  const { signature, secret } = data;
  let { payload } = data;

  if (data.payload.constructor === Object) {
    payload = JSON.stringify(data.payload);
  }
  if (payload.constructor !== Buffer) {
    payload = new Buffer.from(payload, "utf8");
  }

  const hash = crypto.createHmac("sha256", secret);
  hash.update(payload);
  const digest = hash.digest("hex");

  return digest === signature.toLowerCase();
}
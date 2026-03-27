import { VeriflyClient } from "@gadget-client/verifly";

export const api = new VeriflyClient({
  environment: process.env["NODE_ENV"],
});
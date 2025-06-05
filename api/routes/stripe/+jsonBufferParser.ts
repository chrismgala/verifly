import type { Server } from "gadget-server";

/**
 * Boot plugin that adds a custom content type parser for application/json
 * that parses the request body as a buffer instead of as JSON.
 * This is useful when you need to access the raw JSON string for a request.
 */
export default async function plugin(server: Server) {
  server.removeContentTypeParser('application/json');
  
  server.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
    try {
      // We're intentionally returning the raw buffer without parsing
      done(null, body);
    } catch (error) {
      done(error as Error);
    }
  });
}
import type { ApiError } from "./errors";

// Every failed request surfaces as an ApiError (see client.ts), so queries and mutations are typed that way by default.
declare module "@tanstack/react-query" {
  interface Register {
    defaultError: ApiError;
  }
}

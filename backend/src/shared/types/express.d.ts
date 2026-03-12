import "express";
import type { RequestContext } from "./request-context";

declare module "express-serve-static-core" {
  interface Request {
    context: RequestContext;
  }
}
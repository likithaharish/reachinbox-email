declare module "passport-google-oauth20" {
  import type { Strategy as PassportStrategy } from "passport";

  export interface Profile {
    id: string;
    emails?: Array<{ value: string }>;
    displayName?: string;
    photos?: Array<{ value: string }>;
  }

  // Passport strategy base class typing is not strictly needed for this assignment.
  export class Strategy extends PassportStrategy {
    constructor(options: unknown, verify: unknown);
  }
}


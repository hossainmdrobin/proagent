export type OAuthProviderId = "google" | "facebook" | "github";

export interface PublicProviderInfo {
  id: OAuthProviderId;
  label: string;
  configured: boolean;
}
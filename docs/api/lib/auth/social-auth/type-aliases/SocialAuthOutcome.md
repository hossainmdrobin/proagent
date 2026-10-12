[**SaadAgent v0.1.0**](../../../../README.md)

***

[SaadAgent](../../../../modules.md) / [lib/auth/social-auth](../README.md) / SocialAuthOutcome

# Type Alias: SocialAuthOutcome

> **SocialAuthOutcome** = \{ `status`: `"authenticated"`; `user`: [`User`](../../../models/user/type-aliases/User.md); \} \| \{ `status`: `"pending_verification"`; `user`: [`User`](../../../models/user/type-aliases/User.md); \} \| \{ `status`: `"error"`; `code`: [`SocialAuthErrorCode`](SocialAuthErrorCode.md); `message`: `string`; \}

Defined in: [lib/auth/social-auth.ts:15](https://github.com/hossainmdrobin/proagent/blob/bbc56accc10ac2a1319d9afcaf4d9fc411ce704a/lib/auth/social-auth.ts#L15)

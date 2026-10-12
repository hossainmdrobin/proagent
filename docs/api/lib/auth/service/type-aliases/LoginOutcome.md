[**SaadAgent v0.1.0**](../../../../README.md)

***

[SaadAgent](../../../../modules.md) / [lib/auth/service](../README.md) / LoginOutcome

# Type Alias: LoginOutcome

> **LoginOutcome** = \{ `status`: `"success"`; `user`: [`User`](../../../models/user/type-aliases/User.md); \} \| \{ `status`: `"invalid"`; \} \| \{ `status`: `"locked"`; `retryAfterSeconds`: `number`; \} \| \{ `status`: `"unverified"`; `user`: [`User`](../../../models/user/type-aliases/User.md); \}

Defined in: [lib/auth/service.ts:76](https://github.com/hossainmdrobin/proagent/blob/bbc56accc10ac2a1319d9afcaf4d9fc411ce704a/lib/auth/service.ts#L76)

[**SaadAgent v0.1.0**](../../../../README.md)

***

[SaadAgent](../../../../modules.md) / [lib/oauth/state](../README.md) / OAuthStatePayload

# Interface: OAuthStatePayload

Defined in: [lib/oauth/state.ts:12](https://github.com/hossainmdrobin/proagent/blob/bbc56accc10ac2a1319d9afcaf4d9fc411ce704a/lib/oauth/state.ts#L12)

## Extends

- `Record`\<`string`, `unknown`\>

## Indexable

> \[`key`: `string`\]: `unknown`

## Properties

### provider

> **provider**: [`OAuthProviderId`](../../../../types/oauth/type-aliases/OAuthProviderId.md)

Defined in: [lib/oauth/state.ts:13](https://github.com/hossainmdrobin/proagent/blob/bbc56accc10ac2a1319d9afcaf4d9fc411ce704a/lib/oauth/state.ts#L13)

***

### state

> **state**: `string`

Defined in: [lib/oauth/state.ts:14](https://github.com/hossainmdrobin/proagent/blob/bbc56accc10ac2a1319d9afcaf4d9fc411ce704a/lib/oauth/state.ts#L14)

***

### codeVerifier

> **codeVerifier**: `string`

Defined in: [lib/oauth/state.ts:15](https://github.com/hossainmdrobin/proagent/blob/bbc56accc10ac2a1319d9afcaf4d9fc411ce704a/lib/oauth/state.ts#L15)

***

### returnTo

> **returnTo**: `string`

Defined in: [lib/oauth/state.ts:16](https://github.com/hossainmdrobin/proagent/blob/bbc56accc10ac2a1319d9afcaf4d9fc411ce704a/lib/oauth/state.ts#L16)

***

### from

> **from**: `"signup"` \| `"login"`

Defined in: [lib/oauth/state.ts:17](https://github.com/hossainmdrobin/proagent/blob/bbc56accc10ac2a1319d9afcaf4d9fc411ce704a/lib/oauth/state.ts#L17)

***

### issuedAt

> **issuedAt**: `number`

Defined in: [lib/oauth/state.ts:18](https://github.com/hossainmdrobin/proagent/blob/bbc56accc10ac2a1319d9afcaf4d9fc411ce704a/lib/oauth/state.ts#L18)

[**SaadAgent v0.1.0**](../../../../README.md)

***

[SaadAgent](../../../../modules.md) / [lib/auth/service](../README.md) / verifyUserOtp

# Function: verifyUserOtp()

> **verifyUserOtp**(`input`): `Promise`\<\{ `status`: `"success"`; \} \| \{ `status`: `"failure"`; `reason`: `"NOT_FOUND"` \| `"INVALID_OTP"` \| `"EXPIRED"` \| `"TOO_MANY_ATTEMPTS"`; `attemptsRemaining`: `number`; \}\>

Defined in: [lib/auth/service.ts:132](https://github.com/hossainmdrobin/proagent/blob/bbc56accc10ac2a1319d9afcaf4d9fc411ce704a/lib/auth/service.ts#L132)

## Parameters

### input

#### userId

`string`

#### email

`string`

#### code

`string`

## Returns

`Promise`\<\{ `status`: `"success"`; \} \| \{ `status`: `"failure"`; `reason`: `"NOT_FOUND"` \| `"INVALID_OTP"` \| `"EXPIRED"` \| `"TOO_MANY_ATTEMPTS"`; `attemptsRemaining`: `number`; \}\>

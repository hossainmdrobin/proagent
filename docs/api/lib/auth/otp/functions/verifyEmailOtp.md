[**SaadAgent v0.1.0**](../../../../README.md)

***

[SaadAgent](../../../../modules.md) / [lib/auth/otp](../README.md) / verifyEmailOtp

# Function: verifyEmailOtp()

> **verifyEmailOtp**(`input`): `Promise`\<\{ `success`: `true`; \} \| \{ `success`: `false`; `reason`: [`OtpVerificationFailure`](../type-aliases/OtpVerificationFailure.md); `attemptsRemaining`: `number`; \}\>

Defined in: [lib/auth/otp.ts:80](https://github.com/hossainmdrobin/proagent/blob/bbc56accc10ac2a1319d9afcaf4d9fc411ce704a/lib/auth/otp.ts#L80)

## Parameters

### input

#### email

`string`

#### code

`string`

#### secret

`string`

## Returns

`Promise`\<\{ `success`: `true`; \} \| \{ `success`: `false`; `reason`: [`OtpVerificationFailure`](../type-aliases/OtpVerificationFailure.md); `attemptsRemaining`: `number`; \}\>

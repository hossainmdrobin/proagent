[**SaadAgent v0.1.0**](../../../README.md)

***

[SaadAgent](../../../modules.md) / [lib/api-response](../README.md) / ApiError

# Class: ApiError

Defined in: [lib/api-response.ts:9](https://github.com/hossainmdrobin/proagent/blob/bbc56accc10ac2a1319d9afcaf4d9fc411ce704a/lib/api-response.ts#L9)

## Extends

- `Error`

## Constructors

### Constructor

> **new ApiError**(`status`, `code`, `message`, `options?`): `ApiError`

Defined in: [lib/api-response.ts:15](https://github.com/hossainmdrobin/proagent/blob/bbc56accc10ac2a1319d9afcaf4d9fc411ce704a/lib/api-response.ts#L15)

#### Parameters

##### status

`number`

##### code

`string`

##### message

`string`

##### options?

###### fieldErrors?

[`ApiFieldErrors`](../../../types/api/interfaces/ApiFieldErrors.md)

###### headers?

`Record`\<`string`, `string`\>

#### Returns

`ApiError`

#### Overrides

`Error.constructor`

## Properties

### status

> `readonly` **status**: `number`

Defined in: [lib/api-response.ts:10](https://github.com/hossainmdrobin/proagent/blob/bbc56accc10ac2a1319d9afcaf4d9fc411ce704a/lib/api-response.ts#L10)

***

### code

> `readonly` **code**: `string`

Defined in: [lib/api-response.ts:11](https://github.com/hossainmdrobin/proagent/blob/bbc56accc10ac2a1319d9afcaf4d9fc411ce704a/lib/api-response.ts#L11)

***

### fieldErrors?

> `readonly` `optional` **fieldErrors?**: [`ApiFieldErrors`](../../../types/api/interfaces/ApiFieldErrors.md)

Defined in: [lib/api-response.ts:12](https://github.com/hossainmdrobin/proagent/blob/bbc56accc10ac2a1319d9afcaf4d9fc411ce704a/lib/api-response.ts#L12)

***

### headers?

> `readonly` `optional` **headers?**: `Record`\<`string`, `string`\>

Defined in: [lib/api-response.ts:13](https://github.com/hossainmdrobin/proagent/blob/bbc56accc10ac2a1319d9afcaf4d9fc411ce704a/lib/api-response.ts#L13)

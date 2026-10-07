# IPRN Elite API — working notes

_Compiled from a prior review of the provider's docs. Provisional — verify every method name, param, and the auth scheme against the real documentation before shipping._

## Transport

- JSON-RPC 2.0 over HTTPS, single endpoint: `https://api.iprn-elite.com/v1.0`
- Everything is request/response. **No webhook registration method exists in the docs.** Poll-based, not push-based.

## Method groups

| Group                 | Methods                                                                                                                                                                                                                                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account               | `account:get_join` — account info                                                                                                                                                                                                                                                                          |
| Voice                 | `cdr_full:get_list` (CDR/traffic reports), `trunk:get_list`, `allocation:template_by_account_user`, `allocation:subdestination_by_account_user`, `allocation:google_otp_by_account_user`, `allocation:incorporated` (number allocation by trunk)                                                           |
| SMS                   | `sms.mdr_full:get_list`, `sms.mdr_full:group_get_list`, `sms.mdr_full:get_message_by_phone` (traffic/MDR reports), `sms.trunk:get_list`, `sms.trunk_number:get_list`, `sms.allocation:template_by_account_user`, `sms.allocation:subdestination_by_account_user`, `sms.allocation:gan` (number allocation) |
| Realtime (OTP rental) | `sms.realtime.get_subdestination_list`, `sms.realtime.allocate`, `sms.realtime.reallocate`, `sms.realtime.get_message`                                                                                                                                                                                     |
| Access / pricing      | `access_list__get_list:account_price`, `sms.access_list__get_list:account_price`                                                                                                                                                                                                                           |

## Realtime flow — poll-based

1. `sms.realtime.allocate` → returns a number + `message_id` (or `no_access` / `limit_reached` / …)
2. Poll `sms.realtime.get_message` with that `message_id` until it replies:
   - `success` — message received
   - `waiting` — not yet
   - `wrong_id` — expired or invalid
3. `sms.realtime.reallocate` — request the same number again if needed

This is the temporary/virtual-number rental pattern (rent a number for a few minutes, receive one code, release it) — not a persistent "assign a customer their own number for months" SMS gateway.

## Implication for our portal

Reseller portal with per-client accounts, consuming **both**:

1. **Admin / reporting** — trunks, allocations, MDR/CDR lists, access/price lists.
2. **OTP realtime rental** — the allocate → poll → reallocate loop, run server-side in our backend.

Payment/pricing (future): pull real prices from `account_price` / allocation-template methods and convert to local currency.

## Open questions to verify against real docs

- Auth scheme (API key in params? header? token from `account:get_join`?)
- Exact param names for `account:get_join`, `sms.realtime.allocate`, the `get_list` pagination/filter params
- Which statuses come back as `result` values vs `error` objects (the poll statuses appear to be `result` values)

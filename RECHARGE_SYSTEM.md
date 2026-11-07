# Membership recharge and payment verification

## Data and date behavior

- `RechargeRequest` stores the member's payment claim, a server-derived plan/price snapshot, a private proof-file key, and a pending/approved/rejected review state.
- `MembershipRecord` stores immutable approved membership periods and verified payments. On the first approved recharge for a pre-existing member, the previous membership is copied into history with `paymentStatus: "not_recorded"`; it is not misrepresented as a verified UPI payment.
- `Gym.upiPayment` stores the gym's UPI ID, receiver name, payment number, optional instructions, and private QR file key.
- Membership date values are UTC-midnight dates. A plan duration of one month is 30 days, consistent with the existing member plan calculation. Period ends are inclusive (`duration months × 30 days`, minus one day). Active memberships extend from the day after expiry; expired or inactive memberships start on the current gym-local date.
- A screenshot creates a pending claim only. An authorized admin approval, in a MongoDB transaction, is required to create a verified membership record and update the member's current membership.

## API

All endpoints use the existing bearer-token authentication.

| Method | Endpoint | Role | Purpose |
|---|---|---|---|
| GET | `/api/gym/payment-settings` | Admin | Read the gym's UPI settings |
| PUT | `/api/gym/payment-settings` | Admin | Save `upiId`, `receiverName`, `paymentNumber`, and `instructions` |
| POST | `/api/gym/payment-qr` | Admin | Upload multipart field `qr` |
| DELETE | `/api/gym/payment-qr` | Admin | Remove the gym's QR image |
| GET | `/api/gym/payment-qr` | Admin or member | Retrieve the QR after tenant authorization |
| GET | `/api/recharges/me` | Member | Get own plans, requests, history, and payment details |
| POST | `/api/recharges/requests` | Member | Submit multipart `planId`, optional `transactionReference`, and `proof` |
| GET | `/api/recharges/requests/:id/proof` | Admin or member | Retrieve proof only for the same gym; members can retrieve only their own |
| GET | `/api/recharges/admin/requests?status=pending` | Admin | List `pending`, `approved`, `rejected`, or `all` requests for the admin's gym |
| POST | `/api/recharges/admin/requests/:id/approve` | Admin | Verify and approve a pending request |
| POST | `/api/recharges/admin/requests/:id/reject` | Admin | Reject a pending request with optional JSON `{ "reason": "..." }` |
| GET | `/api/recharges/admin/members/:memberId/history` | Admin | Read the member's recharge history in the admin's gym |

Uploaded images are limited to 5 MB and JPG, PNG, or WEBP. The server checks MIME type and file signatures, stores images outside public static paths, and only returns them through authenticated routes.

## Deployment and indexes

- MongoDB must run as a **replica set** to approve requests, because approval atomically updates the request, member, and history record. Approval returns `503` without changing data if transactions are unavailable.
- Before production traffic, set `MONGO_URI` and run `npm run migrate:recharge-indexes` from `backend/`. This creates the unique pending-request and one-record-per-approved-request indexes used for duplicate prevention.
- `PRIVATE_UPLOAD_DIR` is optional. When unset, private files are stored in `backend/private-uploads/`. Configure a persistent, access-restricted directory in production and back it up. This local disk implementation requires a shared persistent volume for multi-instance deployments.
- The upload directory is git-ignored and is not served as static content. Do not mount it under a public web root.

## Manual verification

1. Configure the admin's UPI ID, receiver, optional number/instructions, and QR under **Settings**.
2. Log in as a member, select a plan, pay the displayed amount, and submit a valid screenshot and optional reference. Confirm the request is pending and the current membership dates have not changed.
3. Try submitting the same plan again while pending; the duplicate must be rejected. Try an invalid image type and an image over 5 MB; both must be rejected.
4. As the gym admin, view the proof and approve. Confirm the member's current dates and plan update, payment shows verified, and history includes the period.
5. Approve the same request again or submit two concurrent approvals; only one approval/history period may be committed.
6. Reject another pending request with and without a reason. Confirm dates do not change and a new request for that plan can be submitted after rejection.
7. Test a still-active membership, an expired membership, consecutive approvals, and 1-, 3-, 6-, and 12-month plans. The date calculation unit tests cover the inclusive 30-day periods.
8. Use a second member and a second gym admin to verify cross-member proof access and cross-gym request/review/history access are denied.
9. Try a forged plan ID or altered amount/dates/gym ID. Only the authenticated member's tenant plan and server-side price are used; client-supplied amount, dates, and tenant IDs are ignored.

Run backend unit tests with `npm test` from `backend/`. End-to-end authorization and transaction tests require a MongoDB replica set; this repository does not include a test database or browser/API integration harness.

## Limitations

- UPI payment is manually verified; no bank/UPI gateway integration is performed.
- The private local-file store is suitable for a single server or shared persistent volume. Use a private object store with signed/authenticated access if deploying multiple isolated application instances.
- Existing memberships are preserved as a legacy history snapshot on the member's first approved recharge. Their historic payment cannot be inferred and is marked `not_recorded`.

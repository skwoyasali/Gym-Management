# Super Admin setup

Super Admin accounts are provisioned out of band; public gym registration never
creates privileged accounts. Configure `MONGO_URI` and `JWT_SECRET` as for the
backend, then run `npm run create:super-admin` from the `backend` directory.
The script securely prompts for an email, a hidden password (and confirmation),
and a display name. Passwords must be 12–128 characters with uppercase,
lowercase, and a number.

Alternatively, automation can set `SUPER_ADMIN_EMAIL`,
`SUPER_ADMIN_PASSWORD`, and optionally `SUPER_ADMIN_NAME` before running the
script. The script creates a `super_admin` user and refuses to change the role
of an existing account or overwrite an existing Super Admin.

To change the password for an existing Super Admin, run
`npm run reset:super-admin-password` from the `backend` directory. Enter the
account email and new password in the hidden prompts. The reset only updates a
user whose role is already `super_admin`.

Super Admins sign in through the existing GymPro login page using the Owner /
Admin sign-in option. They can set per-member monthly pricing, manage gym
access/expiry, and record payments. Membership recharges already require MongoDB
transactions, so use a replica set (including a single-node replica set) for
consistent membership and GymPro billing records.

/** Canonical identity row. R-01: `id` is the opaque key every owned row references — never the email. */
export interface StoredUser {
  id: string;
  email: string;
  createdAt: Date;
}

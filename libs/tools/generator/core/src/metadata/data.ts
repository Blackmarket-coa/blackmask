import { deepFreeze } from "@bitwarden/common/tools/util";

/** algorithms for generating credentials */
export const Algorithm = Object.freeze({
  /** A password composed of random characters */
  password: "password",

  /** A password composed of random words from the EFF word list */
  passphrase: "passphrase",

  /** A username composed of words from the EFF word list */
  username: "username",

  /** An email username composed of random characters */
  catchall: "catchall",

  /** An email username composed of words from the EFF word list  */
  plusAddress: "subaddress",
} as const);

/** categorizes credentials according to their use-case outside of Bitwarden */
export const Type = Object.freeze({
  password: "password",
  username: "username",
  email: "email",
} as const);

/** categorizes settings according to their expected use-case within Bitwarden */
export const Profile = Object.freeze({
  /** account-level generator options. This is the default.
   *  @remarks these are the options displayed on the generator tab
   */
  account: "account",

  /** generator options for Secrets Manager secret values.
   *  @remarks kept separate from {@link account} so Secrets Manager settings
   *   do not affect the account-level (Password Manager) generator and vice versa.
   *  @remarks only the `password` algorithm registers metadata for this profile.
   *   `settings()`/`generate$()`/`policy$()` `log.panic` when an algorithm has no
   *   metadata for the requested profile, so only request this profile for the
   *   `password` algorithm until other algorithms opt in.
   */
  secretsManager: "secretsManager",

  // FIXME: consider adding a profile for bitwarden's master password
});

/** Credential generation algorithms grouped by purpose. */
export const AlgorithmsByType = deepFreeze({
  /** Algorithms that produce passwords */
  [Type.password]: [Algorithm.password, Algorithm.passphrase] as const,

  /** Algorithms that produce usernames */
  [Type.username]: [Algorithm.username] as const,

  /** Algorithms that produce email addresses */
  [Type.email]: [Algorithm.catchall, Algorithm.plusAddress] as const,
} as const);

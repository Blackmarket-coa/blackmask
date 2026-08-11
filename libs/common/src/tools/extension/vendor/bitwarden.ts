import { VendorMetadata } from "../type";

import { Vendor } from "./data";

// The vendor id is reserved and must stay backwards compatible; brand identity lives in `name`.
// See ./readme.md.
export const Bitwarden: VendorMetadata = Object.freeze({
  id: Vendor.bitwarden,
  name: "Black Mask",
});

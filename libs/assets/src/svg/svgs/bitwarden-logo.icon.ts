import { svg } from "../svg";

// Black Mask placeholder wordmark (domino-mask glyph + name). The export keeps the
// upstream `BitwardenLogo` name so existing consumers across the clients don't change.
export const BitwardenLogo = svg`
  <svg viewBox="0 0 290 45" xmlns="http://www.w3.org/2000/svg">
    <title>Black Mask</title>
    <path class="tw-fill-marketing-logo" fill-rule="evenodd" d="M2 22.5a21 12.6 0 1 0 42 0a21 12.6 0 1 0 -42 0Zm11.4 -2.2a5.9 4.5 0 1 0 11.8 0a5.9 4.5 0 1 0 -11.8 0Zm17.4 0a5.9 4.5 0 1 0 11.8 0a5.9 4.5 0 1 0 -11.8 0Z" />
    <text class="tw-fill-marketing-logo" x="56" y="34" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="33" font-weight="600" letter-spacing="1">Black Mask</text>
  </svg>
`;

import { svg } from "../svg";

// Black Mask placeholder glyph (domino mask). The export keeps the upstream
// `BitwardenShield` name so existing consumers across the clients don't change.
const BitwardenShield = svg`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 32" fill="none">
    <path class="tw-fill-fg-nav" fill-rule="evenodd" d="M1 16a12 7.6 0 1 0 24 0a12 7.6 0 1 0 -24 0Zm3.7 -1.2a3.4 2.6 0 1 0 6.8 0a3.4 2.6 0 1 0 -6.8 0Zm9.8 0a3.4 2.6 0 1 0 6.8 0a3.4 2.6 0 1 0 -6.8 0Z"/>
  </svg>
`;

export { BitwardenShield };

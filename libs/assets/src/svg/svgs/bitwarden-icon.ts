import { svg } from "../svg";

// Black Mask placeholder app icon (rounded square + domino mask). The export keeps
// the upstream `BitwardenIcon` name so existing consumers across the clients don't change.
export const BitwardenIcon = svg`
<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M17.3333 0H2.66667C1.19391 0 0 1.19391 0 2.66667V17.3333C0 18.8061 1.19391 20 2.66667 20H17.3333C18.8061 20 20 18.8061 20 17.3333V2.66667C20 1.19391 18.8061 0 17.3333 0Z" class="tw-fill-bw-blue" />
  <path class="tw-fill-text-alt2" fill-rule="evenodd" d="M3.6 9.6a6.4 3.9 0 1 0 12.8 0a6.4 3.9 0 1 0 -12.8 0Zm1.9 -0.6a1.85 1.4 0 1 0 3.7 0a1.85 1.4 0 1 0 -3.7 0Zm5.3 0a1.85 1.4 0 1 0 3.7 0a1.85 1.4 0 1 0 -3.7 0Z"/>
</svg>
`;

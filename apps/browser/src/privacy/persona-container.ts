/**
 * Pure mapping from a Black Mask identity layer to a Firefox container descriptor. No browser APIs
 * here — deterministic and unit-testable. The runtime (create the container, open a tab in it) lives
 * in the Angular service via `BrowserApi`.
 */

/** Firefox contextualIdentities color options. */
export const ContainerColor = Object.freeze({
  Blue: "blue",
  Turquoise: "turquoise",
  Green: "green",
  Yellow: "yellow",
  Orange: "orange",
  Red: "red",
  Pink: "pink",
  Purple: "purple",
  Toolbar: "toolbar",
} as const);
export type ContainerColor = (typeof ContainerColor)[keyof typeof ContainerColor];

/** Firefox contextualIdentities icon options. */
export const ContainerIcon = Object.freeze({
  Fingerprint: "fingerprint",
  Briefcase: "briefcase",
  Dollar: "dollar",
  Cart: "cart",
  Circle: "circle",
  Gift: "gift",
  Vacation: "vacation",
  Food: "food",
  Fruit: "fruit",
  Pet: "pet",
  Tree: "tree",
  Chill: "chill",
  Fence: "fence",
} as const);
export type ContainerIcon = (typeof ContainerIcon)[keyof typeof ContainerIcon];

export interface ContainerDescriptor {
  /** Container name, namespaced so Black Mask can find and reuse it. */
  name: string;
  color: ContainerColor;
  icon: ContainerIcon;
}

/** Prefix applied to every Black Mask container name. */
export const CONTAINER_NAME_PREFIX = "Black Mask";

const LAYER_STYLES: Readonly<Record<string, { color: ContainerColor; icon: ContainerIcon }>> =
  Object.freeze({
    Real: { color: ContainerColor.Blue, icon: ContainerIcon.Fingerprint },
    Business: { color: ContainerColor.Orange, icon: ContainerIcon.Briefcase },
    Creator: { color: ContainerColor.Purple, icon: ContainerIcon.Pet },
    Anonymous: { color: ContainerColor.Toolbar, icon: ContainerIcon.Fence },
  });

const DEFAULT_STYLE = Object.freeze({ color: ContainerColor.Blue, icon: ContainerIcon.Circle });

/** Maps an identity layer to the Firefox container (name, color, icon) Black Mask uses for it. */
export function containerForLayer(layer: string): ContainerDescriptor {
  const style = LAYER_STYLES[layer] ?? DEFAULT_STYLE;
  return { name: `${CONTAINER_NAME_PREFIX} — ${layer}`, color: style.color, icon: style.icon };
}

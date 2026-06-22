import { ContainerColor, ContainerIcon, containerForLayer } from "./persona-container";

describe("containerForLayer", () => {
  it("namespaces the container name with the layer", () => {
    expect(containerForLayer("Real").name).toBe("Black Mask — Real");
    expect(containerForLayer("Business").name).toBe("Black Mask — Business");
  });

  it("assigns a distinct color and icon per known layer", () => {
    expect(containerForLayer("Real")).toMatchObject({
      color: ContainerColor.Blue,
      icon: ContainerIcon.Fingerprint,
    });
    expect(containerForLayer("Business")).toMatchObject({
      color: ContainerColor.Orange,
      icon: ContainerIcon.Briefcase,
    });
    expect(containerForLayer("Creator")).toMatchObject({
      color: ContainerColor.Purple,
      icon: ContainerIcon.Pet,
    });
    expect(containerForLayer("Anonymous")).toMatchObject({
      color: ContainerColor.Toolbar,
      icon: ContainerIcon.Fence,
    });
  });

  it("gives the four known layers unique colors", () => {
    const colors = ["Real", "Business", "Creator", "Anonymous"].map(
      (layer) => containerForLayer(layer).color,
    );
    expect(new Set(colors).size).toBe(4);
  });

  it("falls back to a default style for unknown layers", () => {
    const result = containerForLayer("Unknown");

    expect(result.name).toBe("Black Mask — Unknown");
    expect(result.color).toBe(ContainerColor.Blue);
    expect(result.icon).toBe(ContainerIcon.Circle);
  });
});

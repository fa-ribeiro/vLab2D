import { assertStringIncludes, assertThrows } from "@std/assert";

import { type KinematicBodySnapshot, KinematicState, Vector2 } from "../engine/mod.ts";
import { SvgKinematicRenderer } from "./svg-kinematic-renderer.ts";

Deno.test("SvgKinematicRenderer maps mathematical world coordinates to SVG coordinates", () => {
  const renderer = new SvgKinematicRenderer(200, 100, 10, 3);

  const snapshots: readonly KinematicBodySnapshot[] = [
    {
      id: 7,
      state: new KinematicState(new Vector2(2, 3), new Vector2(0, 0)),
    },
  ];

  const svg = renderer.render(snapshots);

  assertStringIncludes(svg, '<circle data-body-id="7" cx="120" cy="20" r="3" />');
});

Deno.test("SvgKinematicRenderer renders every supplied body snapshot", () => {
  const renderer = new SvgKinematicRenderer(200, 100, 10, 2);

  const snapshots: readonly KinematicBodySnapshot[] = [
    {
      id: 1,
      state: new KinematicState(new Vector2(-5, -2), new Vector2(0, 0)),
    },
    {
      id: 2,
      state: new KinematicState(new Vector2(4, 1), new Vector2(0, 0)),
    },
  ];

  const svg = renderer.render(snapshots);

  assertStringIncludes(svg, '<circle data-body-id="1" cx="50" cy="70" r="2" />');

  assertStringIncludes(svg, '<circle data-body-id="2" cx="140" cy="40" r="2" />');
});

Deno.test("SvgKinematicRenderer renders a valid SVG when no bodies are present", () => {
  const renderer = new SvgKinematicRenderer(200, 100, 10);

  const svg = renderer.render([]);

  assertStringIncludes(svg, '<svg xmlns="http://www.w3.org/2000/svg"');

  assertStringIncludes(svg, "</svg>");
});

Deno.test("SvgKinematicRenderer rejects a non-positive display scale", () => {
  assertThrows(
    () => new SvgKinematicRenderer(200, 100, 0),
    RangeError,
    "Pixels per unit must be a positive finite number.",
  );
});

Deno.test("SvgKinematicRenderer marks the world origin at the viewport center", () => {
  const renderer = new SvgKinematicRenderer(200, 100, 10);

  const svg = renderer.render([]);

  assertStringIncludes(svg, '<g data-world-origin="">');

  assertStringIncludes(svg, '<line x1="95" y1="50" x2="105" y2="50" stroke="currentColor" />');

  assertStringIncludes(svg, '<line x1="100" y1="45" x2="100" y2="55" stroke="currentColor" />');
});

Deno.test("SvgKinematicRenderer renders world axes through the origin", () => {
  const renderer = new SvgKinematicRenderer(200, 100, 10);

  const svg = renderer.render([]);

  assertStringIncludes(
    svg,
    '<line data-world-axis="x" x1="0" y1="50" x2="200" y2="50" stroke="currentColor" />',
  );

  assertStringIncludes(
    svg,
    '<line data-world-axis="y" x1="100" y1="0" x2="100" y2="100" stroke="currentColor" />',
  );
});

import { assert, assertStringIncludes, assertThrows } from "@std/assert";

import {
  Body,
  type BodyId,
  type BodySnapshot,
  type BodyState,
  Vector2,
} from "../engine/mod.ts";
import { SvgKinematicRenderer } from "./svg-kinematic-renderer.ts";

function createBodyState(position: Vector2, velocity: Vector2): BodyState {
  return { position, velocity };
}

function createBodySnapshot(
  id: BodyId,
  position: Vector2,
  velocity = new Vector2(0, 0),
): BodySnapshot {
  return {
    id,
    definition: new Body(),
    state: createBodyState(position, velocity),
  };
}

Deno.test("SvgKinematicRenderer maps mathematical world coordinates to SVG coordinates", () => {
  const renderer = new SvgKinematicRenderer(200, 100, 10, 3);

  const snapshots: readonly BodySnapshot[] = [createBodySnapshot(7, new Vector2(2, 3))];

  const svg = renderer.render(snapshots);

  assertStringIncludes(svg, '<circle data-body-id="7" cx="120" cy="20" r="3" />');
});

Deno.test("SvgKinematicRenderer renders every supplied body snapshot", () => {
  const renderer = new SvgKinematicRenderer(200, 100, 10, 2);

  const snapshots: readonly BodySnapshot[] = [
    createBodySnapshot(1, new Vector2(-5, -2)),
    createBodySnapshot(2, new Vector2(4, 1)),
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
    '<line data-world-axis="x" x1="0" y1="50" x2="200" y2="50" stroke="currentColor" opacity="0.45" />',
  );

  assertStringIncludes(
    svg,
    '<line data-world-axis="y" x1="100" y1="0" x2="100" y2="100" stroke="currentColor" opacity="0.45" />',
  );
});

Deno.test("SvgKinematicRenderer renders a grid at integer world coordinates", () => {
  const renderer = new SvgKinematicRenderer(100, 60, 20);

  const svg = renderer.render([]);

  assertStringIncludes(
    svg,
    '<g data-world-grid="" stroke="currentColor" stroke-opacity="0.15">',
  );

  assertStringIncludes(svg, '<line x1="30" y1="0" x2="30" y2="60" />');

  assertStringIncludes(svg, '<line x1="70" y1="0" x2="70" y2="60" />');

  assertStringIncludes(svg, '<line x1="0" y1="10" x2="100" y2="10" />');

  assertStringIncludes(svg, '<line x1="0" y1="50" x2="100" y2="50" />');
});

Deno.test("SvgKinematicRenderer leaves zero-coordinate lines to the world axes", () => {
  const renderer = new SvgKinematicRenderer(100, 60, 20);

  const svg = renderer.render([]);

  assert(!svg.includes('<line x1="50" y1="0" x2="50" y2="60" />'));

  assert(!svg.includes('<line x1="0" y1="30" x2="100" y2="30" />'));
});

Deno.test("SvgKinematicRenderer renders relative to the viewport world center", () => {
  const renderer = new SvgKinematicRenderer(200, 100, 10, 3);

  renderer.setViewportCenter(3, -2);

  const snapshots: readonly BodySnapshot[] = [createBodySnapshot(7, new Vector2(3, -2))];

  const svg = renderer.render(snapshots);

  assertStringIncludes(svg, '<circle data-body-id="7" cx="100" cy="50" r="3" />');
});

Deno.test("SvgKinematicRenderer moves world axes with the viewport center", () => {
  const renderer = new SvgKinematicRenderer(200, 100, 10);

  renderer.setViewportCenter(3, -2);

  const svg = renderer.render([]);

  assertStringIncludes(
    svg,
    '<line data-world-axis="x" x1="0" y1="30" x2="200" y2="30" stroke="currentColor" opacity="0.45" />',
  );

  assertStringIncludes(
    svg,
    '<line data-world-axis="y" x1="70" y1="0" x2="70" y2="100" stroke="currentColor" opacity="0.45" />',
  );
});

Deno.test("SvgKinematicRenderer renders using the changed viewport scale", () => {
  const renderer = new SvgKinematicRenderer(200, 100, 10, 3);

  renderer.setViewportCenter(3, -2);
  renderer.setViewportScale(20);

  const snapshots: readonly BodySnapshot[] = [createBodySnapshot(7, new Vector2(4, -1))];

  const svg = renderer.render(snapshots);

  assertStringIncludes(svg, '<circle data-body-id="7" cx="120" cy="30" r="3" />');
});

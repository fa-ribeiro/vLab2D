import { assertEquals } from "@std/assert";

import {
  Body,
  type BodyId,
  type BodySnapshot,
  type BodyState,
  Circle,
  Rectangle,
  Vector2,
} from "../engine/mod.ts";
import { CanvasInspectionRenderer } from "./canvas-inspection-renderer.ts";
import type { InspectionOptions } from "./inspection-options.ts";
import { ViewportTransform } from "./viewport-transform.ts";

function createBodyState(position: Vector2, velocity: Vector2, orientation = 0): BodyState {
  return { position, velocity, orientation };
}

function createBodySnapshot(
  id: BodyId,
  position: Vector2,
  velocity = new Vector2(0, 0),
  definition = new Body(),
  orientation = 0,
): BodySnapshot {
  return {
    id,
    definition,
    state: createBodyState(position, velocity, orientation),
  };
}

function inspectionOptions(overrides: Partial<InspectionOptions> = {}): InspectionOptions {
  return {
    showGeometryContour: false,
    showBodyOrigin: false,
    showOrientation: false,
    ...overrides,
  };
}

class RecordingCanvasContext {
  readonly calls: unknown[][] = [];

  strokeStyle: string | CanvasGradient | CanvasPattern = "";
  lineWidth = 1;

  beginPath(): void {
    this.calls.push(["beginPath"]);
  }

  moveTo(x: number, y: number): void {
    this.calls.push(["moveTo", x, y]);
  }

  lineTo(x: number, y: number): void {
    this.calls.push(["lineTo", x, y]);
  }

  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void {
    this.calls.push(["arc", x, y, radius, startAngle, endAngle]);
  }

  stroke(): void {
    this.calls.push(["stroke"]);
  }

  strokeRect(x: number, y: number, width: number, height: number): void {
    this.calls.push(["strokeRect", x, y, width, height]);
  }

  save(): void {
    this.calls.push(["save"]);
  }

  restore(): void {
    this.calls.push(["restore"]);
  }

  translate(x: number, y: number): void {
    this.calls.push(["translate", x, y]);
  }

  rotate(angle: number): void {
    this.calls.push(["rotate", angle]);
  }
}

Deno.test("CanvasInspectionRenderer draws nothing when all indicators are disabled", () => {
  const context = new RecordingCanvasContext();
  const transform = new ViewportTransform(200, 100, 10);
  const renderer = new CanvasInspectionRenderer(context, transform);

  renderer.render([createBodySnapshot(7, new Vector2(2, 3))], inspectionOptions());

  assertEquals(context.calls, []);
});

Deno.test("CanvasInspectionRenderer marks the Body origin in display space", () => {
  const context = new RecordingCanvasContext();
  const transform = new ViewportTransform(200, 100, 10);
  const renderer = new CanvasInspectionRenderer(context, transform);

  renderer.render(
    [createBodySnapshot(7, new Vector2(2, 3))],
    inspectionOptions({ showBodyOrigin: true }),
  );

  const arcCalls = context.calls.filter(([name]) => name === "arc");

  assertEquals(arcCalls, [["arc", 120, 20, 3, 0, Math.PI * 2]]);
});

Deno.test("CanvasInspectionRenderer does not draw orientation for a shapeless Body", () => {
  const context = new RecordingCanvasContext();
  const transform = new ViewportTransform(200, 100, 10);
  const renderer = new CanvasInspectionRenderer(context, transform);

  renderer.render(
    [createBodySnapshot(7, new Vector2(2, 1), new Vector2(0, 0), new Body(), Math.PI / 2)],
    inspectionOptions({ showOrientation: true }),
  );

  const moveToCalls = context.calls.filter(([name]) => name === "moveTo");
  const lineToCalls = context.calls.filter(([name]) => name === "lineTo");
  const rotateCalls = context.calls.filter(([name]) => name === "rotate");

  assertEquals(moveToCalls, []);
  assertEquals(lineToCalls, []);
  assertEquals(rotateCalls, []);
});

Deno.test("CanvasInspectionRenderer draws orientation along Body-local positive X", () => {
  const context = new RecordingCanvasContext();
  const transform = new ViewportTransform(200, 100, 10);
  const renderer = new CanvasInspectionRenderer(context, transform);

  renderer.render(
    [
      createBodySnapshot(
        7,
        new Vector2(2, 1),
        new Vector2(0, 0),
        new Body({ shape: new Circle(1) }),
        Math.PI / 2,
      ),
    ],
    inspectionOptions({ showOrientation: true }),
  );

  const translateCalls = context.calls.filter(([name]) => name === "translate");
  const rotateCalls = context.calls.filter(([name]) => name === "rotate");
  const moveToCalls = context.calls.filter(([name]) => name === "moveTo");
  const lineToCalls = context.calls.filter(([name]) => name === "lineTo");

  assertEquals(translateCalls, [["translate", 120, 40]]);
  assertEquals(rotateCalls, [["rotate", -Math.PI / 2]]);
  assertEquals(moveToCalls, [["moveTo", 0, 0]]);
  assertEquals(lineToCalls, [["lineTo", 18, 0]]);
});

Deno.test("CanvasInspectionRenderer contours Circle geometry at viewport scale", () => {
  const context = new RecordingCanvasContext();
  const transform = new ViewportTransform(200, 100, 10);
  const renderer = new CanvasInspectionRenderer(context, transform);

  renderer.render(
    [
      createBodySnapshot(
        7,
        new Vector2(2, 3),
        new Vector2(0, 0),
        new Body({ shape: new Circle(1.5) }),
      ),
    ],
    inspectionOptions({ showGeometryContour: true }),
  );

  const arcCalls = context.calls.filter(([name]) => name === "arc");

  assertEquals(arcCalls, [["arc", 0, 0, 15, 0, Math.PI * 2]]);
});

Deno.test("CanvasInspectionRenderer contours oriented Rectangle geometry", () => {
  const context = new RecordingCanvasContext();
  const transform = new ViewportTransform(200, 100, 10);
  const renderer = new CanvasInspectionRenderer(context, transform);

  renderer.render(
    [
      createBodySnapshot(
        7,
        new Vector2(2, 1),
        new Vector2(0, 0),
        new Body({ shape: new Rectangle(4, 2) }),
        Math.PI / 2,
      ),
    ],
    inspectionOptions({ showGeometryContour: true }),
  );

  const translateCalls = context.calls.filter(([name]) => name === "translate");
  const rotateCalls = context.calls.filter(([name]) => name === "rotate");
  const strokeRectCalls = context.calls.filter(([name]) => name === "strokeRect");

  assertEquals(translateCalls, [["translate", 120, 40]]);
  assertEquals(rotateCalls, [["rotate", -Math.PI / 2]]);
  assertEquals(strokeRectCalls, [["strokeRect", -20, -10, 40, 20]]);
});

Deno.test(
  "CanvasInspectionRenderer does not invent contour geometry for shapeless Bodies",
  () => {
    const context = new RecordingCanvasContext();
    const transform = new ViewportTransform(200, 100, 10);
    const renderer = new CanvasInspectionRenderer(context, transform);

    renderer.render(
      [createBodySnapshot(7, new Vector2(2, 3))],
      inspectionOptions({ showGeometryContour: true }),
    );

    const arcCalls = context.calls.filter(([name]) => name === "arc");
    const strokeRectCalls = context.calls.filter(([name]) => name === "strokeRect");

    assertEquals(arcCalls, []);
    assertEquals(strokeRectCalls, []);
  },
);

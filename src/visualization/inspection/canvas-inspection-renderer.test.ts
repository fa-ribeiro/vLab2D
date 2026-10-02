import { assertEquals } from "@std/assert";

import {
  Body,
  type BodyId,
  type BodySnapshot,
  type BodyState,
  Circle,
  Rectangle,
  Vector2,
} from "../../engine/mod.ts";
import { CanvasInspectionRenderer } from "./canvas-inspection-renderer.ts";
import type { InspectionOptions } from "./inspection-options.ts";
import { ViewportTransform } from "../viewport/viewport-transform.ts";

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

type InspectionOptionsOverrides = {
  readonly defaultStyle?: Partial<InspectionOptions["defaultStyle"]>;
  readonly geometryContour?: Partial<InspectionOptions["geometryContour"]>;
  readonly bodyOrigin?: Partial<InspectionOptions["bodyOrigin"]>;
  readonly orientation?: Partial<InspectionOptions["orientation"]>;
  readonly velocity?: Partial<InspectionOptions["velocity"]>;
};

function inspectionOptions(overrides: InspectionOptionsOverrides = {}): InspectionOptions {
  return {
    defaultStyle: {
      color: "#d97706",
      lineWidth: 1.5,
      ...overrides.defaultStyle,
    },
    geometryContour: {
      visible: false,
      ...overrides.geometryContour,
    },
    bodyOrigin: {
      visible: false,
      radius: 3,
      ...overrides.bodyOrigin,
    },
    orientation: {
      visible: false,
      length: 18,
      ...overrides.orientation,
    },
    velocity: {
      visible: false,
      projectionTime: 1,
      arrowheadSize: 6,
      minimumVisibleLength: 8,
      ...overrides.velocity,
    },
  };
}

class RecordingCanvasContext {
  readonly calls: unknown[][] = [];

  #strokeStyle: string | CanvasGradient | CanvasPattern = "";
  #lineWidth = 1;

  get strokeStyle(): string | CanvasGradient | CanvasPattern {
    return this.#strokeStyle;
  }

  set strokeStyle(value: string | CanvasGradient | CanvasPattern) {
    this.#strokeStyle = value;
    this.calls.push(["strokeStyle", value]);
  }

  get lineWidth(): number {
    return this.#lineWidth;
  }

  set lineWidth(value: number) {
    this.#lineWidth = value;
    this.calls.push(["lineWidth", value]);
  }

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

Deno.test(
  "CanvasInspectionRenderer uses default style when an indicator has no override",
  () => {
    const context = new RecordingCanvasContext();
    const transform = new ViewportTransform(200, 100, 10);
    const renderer = new CanvasInspectionRenderer(context, transform);

    renderer.render(
      [createBodySnapshot(7, new Vector2(2, 3))],
      inspectionOptions({
        defaultStyle: { color: "#123456", lineWidth: 2 },
        bodyOrigin: { visible: true },
      }),
    );

    assertEquals(
      context.calls.filter(([name]) => name === "strokeStyle"),
      [["strokeStyle", "#123456"]],
    );
    assertEquals(
      context.calls.filter(([name]) => name === "lineWidth"),
      [["lineWidth", 2]],
    );
  },
);

Deno.test("CanvasInspectionRenderer lets an indicator fully override default style", () => {
  const context = new RecordingCanvasContext();
  const transform = new ViewportTransform(200, 100, 10);
  const renderer = new CanvasInspectionRenderer(context, transform);

  renderer.render(
    [createBodySnapshot(7, new Vector2(0, 0), new Vector2(2, 0))],
    inspectionOptions({
      velocity: {
        visible: true,
        style: {
          color: "#16a34a",
          lineWidth: 3,
        },
      },
    }),
  );

  assertEquals(
    context.calls.filter(([name]) => name === "strokeStyle"),
    [["strokeStyle", "#16a34a"]],
  );
  assertEquals(
    context.calls.filter(([name]) => name === "lineWidth"),
    [["lineWidth", 3]],
  );
});

Deno.test(
  "CanvasInspectionRenderer inherits missing style properties from default style",
  () => {
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
      inspectionOptions({
        defaultStyle: { color: "#d97706", lineWidth: 2 },
        orientation: {
          visible: true,
          style: {
            color: "#dc2626",
          },
        },
      }),
    );

    assertEquals(
      context.calls.filter(([name]) => name === "strokeStyle"),
      [["strokeStyle", "#dc2626"]],
    );
    assertEquals(
      context.calls.filter(([name]) => name === "lineWidth"),
      [["lineWidth", 2]],
    );
  },
);

Deno.test("CanvasInspectionRenderer applies independent styles to different indicators", () => {
  const context = new RecordingCanvasContext();
  const transform = new ViewportTransform(200, 100, 10);
  const renderer = new CanvasInspectionRenderer(context, transform);

  renderer.render(
    [
      createBodySnapshot(
        7,
        new Vector2(0, 0),
        new Vector2(2, 0),
        new Body({ shape: new Circle(1) }),
        Math.PI / 4,
      ),
    ],
    inspectionOptions({
      orientation: {
        visible: true,
        style: { color: "#dc2626" },
      },
      velocity: {
        visible: true,
        style: { color: "#16a34a", lineWidth: 2 },
      },
    }),
  );

  assertEquals(
    context.calls.filter(([name]) => name === "strokeStyle"),
    [
      ["strokeStyle", "#dc2626"],
      ["strokeStyle", "#16a34a"],
    ],
  );

  assertEquals(
    context.calls.filter(([name]) => name === "lineWidth"),
    [
      ["lineWidth", 1.5],
      ["lineWidth", 2],
    ],
  );
});

Deno.test(
  "CanvasInspectionRenderer marks the Body origin using configured display radius",
  () => {
    const context = new RecordingCanvasContext();
    const transform = new ViewportTransform(200, 100, 10);
    const renderer = new CanvasInspectionRenderer(context, transform);

    renderer.render(
      [createBodySnapshot(7, new Vector2(2, 3))],
      inspectionOptions({ bodyOrigin: { visible: true, radius: 5 } }),
    );

    const arcCalls = context.calls.filter(([name]) => name === "arc");

    assertEquals(arcCalls, [["arc", 120, 20, 5, 0, Math.PI * 2]]);
  },
);

Deno.test("CanvasInspectionRenderer does not draw orientation for a shapeless Body", () => {
  const context = new RecordingCanvasContext();
  const transform = new ViewportTransform(200, 100, 10);
  const renderer = new CanvasInspectionRenderer(context, transform);

  renderer.render(
    [createBodySnapshot(7, new Vector2(2, 1), new Vector2(0, 0), new Body(), Math.PI / 2)],
    inspectionOptions({ orientation: { visible: true } }),
  );

  const moveToCalls = context.calls.filter(([name]) => name === "moveTo");
  const lineToCalls = context.calls.filter(([name]) => name === "lineTo");
  const rotateCalls = context.calls.filter(([name]) => name === "rotate");

  assertEquals(moveToCalls, []);
  assertEquals(lineToCalls, []);
  assertEquals(rotateCalls, []);
});

Deno.test(
  "CanvasInspectionRenderer draws configured orientation along Body-local positive X",
  () => {
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
      inspectionOptions({ orientation: { visible: true, length: 24 } }),
    );

    const translateCalls = context.calls.filter(([name]) => name === "translate");
    const rotateCalls = context.calls.filter(([name]) => name === "rotate");
    const moveToCalls = context.calls.filter(([name]) => name === "moveTo");
    const lineToCalls = context.calls.filter(([name]) => name === "lineTo");

    assertEquals(translateCalls, [["translate", 120, 40]]);
    assertEquals(rotateCalls, [["rotate", -Math.PI / 2]]);
    assertEquals(moveToCalls, [["moveTo", 0, 0]]);
    assertEquals(lineToCalls, [["lineTo", 24, 0]]);
  },
);

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
    inspectionOptions({ geometryContour: { visible: true } }),
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
    inspectionOptions({ geometryContour: { visible: true } }),
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
      inspectionOptions({ geometryContour: { visible: true } }),
    );

    const arcCalls = context.calls.filter(([name]) => name === "arc");
    const strokeRectCalls = context.calls.filter(([name]) => name === "strokeRect");

    assertEquals(arcCalls, []);
    assertEquals(strokeRectCalls, []);
  },
);

Deno.test(
  "CanvasInspectionRenderer uses configured velocity projection and arrowhead size",
  () => {
    const context = new RecordingCanvasContext();
    const transform = new ViewportTransform(200, 100, 10);
    const renderer = new CanvasInspectionRenderer(context, transform);

    renderer.render(
      [createBodySnapshot(7, new Vector2(2, 1), new Vector2(2, 0))],
      inspectionOptions({
        velocity: {
          visible: true,
          projectionTime: 0.5,
          arrowheadSize: 4,
          minimumVisibleLength: 1,
        },
      }),
    );

    const moveToCalls = context.calls.filter(([name]) => name === "moveTo");
    const lineToCalls = context.calls.filter(([name]) => name === "lineTo");

    assertEquals(moveToCalls, [
      ["moveTo", 120, 40],
      ["moveTo", 130, 40],
      ["moveTo", 130, 40],
    ]);

    assertEquals(lineToCalls, [
      ["lineTo", 130, 40],
      ["lineTo", 126, 42],
      ["lineTo", 126, 38],
    ]);
  },
);

Deno.test("CanvasInspectionRenderer maps positive world Y velocity upward on display", () => {
  const context = new RecordingCanvasContext();
  const transform = new ViewportTransform(200, 100, 10);
  const renderer = new CanvasInspectionRenderer(context, transform);

  renderer.render(
    [createBodySnapshot(7, new Vector2(0, 0), new Vector2(0, 2))],
    inspectionOptions({ velocity: { visible: true, minimumVisibleLength: 1 } }),
  );

  const lineToCalls = context.calls.filter(([name]) => name === "lineTo");

  assertEquals(lineToCalls[0], ["lineTo", 100, 30]);
});

Deno.test("CanvasInspectionRenderer uses display-space velocity visibility threshold", () => {
  const context = new RecordingCanvasContext();
  const transform = new ViewportTransform(200, 100, 10);
  const renderer = new CanvasInspectionRenderer(context, transform);
  const snapshots = [createBodySnapshot(7, new Vector2(0, 0), new Vector2(0.5, 0))];

  const options = inspectionOptions({
    velocity: { visible: true, minimumVisibleLength: 8 },
  });

  renderer.render(snapshots, options);

  assertEquals(
    context.calls.filter(([name]) => name === "moveTo"),
    [],
  );

  transform.setPixelsPerUnit(20);
  renderer.render(snapshots, options);

  assertEquals(context.calls.filter(([name]) => name === "moveTo").length > 0, true);
});

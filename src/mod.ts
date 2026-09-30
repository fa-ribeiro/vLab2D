/**
 * Public package API for vLab2D.
 *
 * Consumers should prefer this module when composing complete simulations,
 * runtimes, and visualizations. Layer-specific modules remain available
 * internally where narrower dependency boundaries are useful.
 *
 * @module
 */

export * from "./engine/mod.ts";

export { Simulation } from "./simulation/simulation.ts";
export type { SimulationWorldStatus } from "./simulation/simulation.ts";

export { BrowserSimulationRuntime } from "./runtime/browser/simulation-runtime.ts";
export type { BrowserSimulationRuntimeOptions } from "./runtime/browser/simulation-runtime.ts";

export { BodyPicker } from "./visualization/interaction/body-picker.ts";
export { CanvasInspectionRenderer } from "./visualization/inspection/canvas-inspection-renderer.ts";
export { CanvasKinematicRenderer } from "./visualization/rendering/canvas-kinematic-renderer.ts";
export type { InspectionOptions } from "./visualization/inspection/inspection-options.ts";
export { SvgKinematicRenderer } from "./visualization/rendering/svg-kinematic-renderer.ts";
export { ViewportTransform } from "./visualization/viewport/viewport-transform.ts";

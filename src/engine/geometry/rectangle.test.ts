import { assertEquals } from "@std/assert";

import { Rectangle } from "./rectangle.ts";

Deno.test("Rectangle stores its dimensions", () => {
  const rectangle = new Rectangle(4, 2);

  assertEquals(rectangle.width, 4);
  assertEquals(rectangle.height, 2);
});

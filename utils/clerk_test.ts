// File: /utils/clerk_test.ts
// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.

import { assertRejects } from "$std/assert/assert_rejects.ts";
import { getClerkUser } from "./clerk.ts";
import { returnsNext, stub } from "$std/testing/mock.ts";
import { assertEquals } from "$std/assert/assert_equals.ts";
import { STATUS_CODE } from "$std/http/status.ts";
import { BadRequestError } from "@/utils/http.ts";

Deno.test("[plugins] getClerkUser()", async (test) => {
  await test.step("rejects on error message", async () => {
    const message = crypto.randomUUID();
    const fetchStub = stub(
      window,
      "fetch",
      returnsNext([
        Promise.resolve(
          new Response(message, { status: STATUS_CODE.BadRequest })
        ),
      ])
    );
    await assertRejects(
      async () => await getClerkUser(crypto.randomUUID()),
      BadRequestError,
      message
    );
    fetchStub.restore();
  });

  await test.step("resolves to a Clerk user object", async () => {
    const body = {
      id: crypto.randomUUID(),
      email: "user@example.com",
      name: "John Doe",
      picture: "https://example.com/picture.jpg",
    };
    const fetchStub = stub(
      window,
      "fetch",
      returnsNext([Promise.resolve(Response.json(body))])
    );
    assertEquals(await getClerkUser(crypto.randomUUID()), body);
    fetchStub.restore();
  });
});

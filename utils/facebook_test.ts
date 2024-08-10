// File: /utils/facebook_test.ts
// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.

import { assertRejects } from "$std/assert/assert_rejects.ts";
import { getFacebookUser } from "./facebook.ts";
import { returnsNext, stub } from "$std/testing/mock.ts";
import { assertEquals } from "$std/assert/assert_equals.ts";
import { STATUS_CODE } from "$std/http/status.ts";
import { BadRequestError } from "@/utils/http.ts";

Deno.test("[plugins] getFacebookUser()", async (test) => {
  await test.step("rejects on error message", async () => {
    const message = crypto.randomUUID();
    const fetchStub = stub(
      window,
      "fetch",
      returnsNext([
        Promise.resolve(
          Response.json(
            { error: { message } },
            { status: STATUS_CODE.BadRequest }
          )
        ),
      ])
    );
    await assertRejects(
      async () => await getFacebookUser(crypto.randomUUID()),
      BadRequestError,
      message
    );
    fetchStub.restore();
  });

  await test.step("resolves to a Facebook user object", async () => {
    const body = {
      id: crypto.randomUUID(),
      name: "John Doe",
      email: "user@example.com",
    };
    const fetchStub = stub(
      window,
      "fetch",
      returnsNext([Promise.resolve(Response.json(body))])
    );
    assertEquals(await getFacebookUser(crypto.randomUUID()), body);
    fetchStub.restore();
  });
});

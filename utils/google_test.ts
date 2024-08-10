// File: /utils/google_test.ts
// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.

import { assertRejects } from "$std/assert/assert_rejects.ts";
import { getGoogleUser } from "./google.ts";
import { returnsNext, stub } from "$std/testing/mock.ts";
import { assertEquals } from "$std/assert/assert_equals.ts";
import { STATUS_CODE } from "$std/http/status.ts";
import { BadRequestError } from "@/utils/http.ts";

Deno.test("[plugins] getGoogleUser()", async (test) => {
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
      async () => await getGoogleUser(crypto.randomUUID()),
      BadRequestError,
      message
    );
    fetchStub.restore();
  });

  await test.step("resolves to a Google user object", async () => {
    const body = {
      id: crypto.randomUUID(),
      email: "user@example.com",
      verified_email: true,
      name: "John Doe",
      given_name: "John",
      family_name: "Doe",
      picture: "https://example.com/picture.jpg",
      locale: "en",
    };
    const fetchStub = stub(
      window,
      "fetch",
      returnsNext([Promise.resolve(Response.json(body))])
    );
    assertEquals(await getGoogleUser(crypto.randomUUID()), body);
    fetchStub.restore();
  });
});

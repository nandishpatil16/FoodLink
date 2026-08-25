import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * TEMPORARY DEV HELPER — accepts any password for any email.
 * Creates the user if missing, otherwise resets the password to whatever was
 * typed, so sign-in always succeeds. Remove before going live.
 */
export const devEnsureLogin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ email: z.string().email(), password: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = list?.users.find(
      (u) => (u.email ?? "").toLowerCase() === data.email.toLowerCase(),
    );

    if (existing) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password: data.password,
        email_confirm: true,
      });
      if (error) throw new Error(error.message);
      return { ok: true, created: false };
    }

    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    return { ok: true, created: true };
  });

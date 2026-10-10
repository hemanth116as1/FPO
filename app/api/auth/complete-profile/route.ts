import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user.phoneNumberVerified) {
    return Response.json({ error: "Verify your mobile number first." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const fields = body as Record<string, unknown>;
  const name = fields.name;
  const password = fields.password;
  if (typeof name !== "string" || name.trim().length < 2) {
    return Response.json({ error: "Enter a name with at least 2 characters." }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  try {
    await auth.api.updateUser({
      body: { name: name.trim() },
      headers: request.headers,
    });
    await auth.api.setPassword({
      body: { newPassword: password },
      headers: request.headers,
    });

    return Response.json({ status: true });
  } catch (error) {
    console.error("Could not complete account setup:", error);
    return Response.json(
      { error: "Could not save your account details. Please try again." },
      { status: 400 },
    );
  }
}

import "dotenv/config";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";
import getCachedUserRecords from "./cache-user-records"

function normalizeIndianPhoneNumber(input: string) {
  const digits = input.replace(/\D/g, "");
  const nationalNumber =
    digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;

  if (!/^[6-9]\d{9}$/.test(nationalNumber)) {
    throw new Error("SUPER_ADMIN_PHONE must be a valid Indian mobile number");
  }

  return `+91${nationalNumber}`;
}

export async function POST(request: Request) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session){
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const permission = await auth.api.userHasPermission({
        body: { permissions: { users: ["create"] } },
        headers: request.headers,
      });
      if (!permission.success) {
        return Response.json(
          { error: "You do not have permission to create milk records." },
          { status: 403 },
        );
      }
    
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return Response.json({ error: "Request body must be a JSON object." }, { status: 400 });
    }

    const fields = body as Record<string, unknown>;
    const phoneInput = fields.phoneInput;
    const emailInput = fields.email;
    const nameInput = fields.name;
    const password = fields.password;

    if (
        typeof phoneInput !== "string" ||
        typeof emailInput !== "string" ||
        typeof nameInput !== "string" ||
        typeof password !== "string"
    ) {
        return Response.json({ error: "Invalid request fields." }, { status: 400 });
    }

    const email = emailInput.trim();
    const name = nameInput.trim();

    if (!phoneInput.trim() || !email || !name || !password) {
        return Response.json({ error: "All fields are required." }, { status: 400 });
    }

    const phoneNumber = normalizeIndianPhoneNumber(phoneInput);
    const authContext = await auth.$context;
    const { minPasswordLength, maxPasswordLength } =
        authContext.password.config;

    if (
        password.length < minPasswordLength ||
        password.length > maxPasswordLength
    ) {
        throw new Error(
        `SUPER_ADMIN_PASSWORD must be between ${minPasswordLength} and ${maxPasswordLength} characters`,
        );
    }

    const passwordHash = await authContext.password.hash(password);
    const userId = crypto.randomUUID();

    const user = await prisma.$transaction(async (transaction) => {
        const existingUser = await transaction.user.findUnique({
        where: { phoneNumber },
        include: { accounts: true },
        });

        
        if (!existingUser) {
        return transaction.user.create({
            data: {
            id: userId,
            name,
            email,
            role: "BASIC_USER",
            phoneNumber,
            phoneNumberVerified: true,
            accounts: {
                create: {
                id: crypto.randomUUID(),
                accountId: userId,
                providerId: "credential",
                password: passwordHash,
                },
            },
            },
        });
        }


        const credentialAccount = existingUser.accounts.find(
        (account) => account.providerId === "credential",
        );

        if (credentialAccount) {
        await transaction.account.update({
            where: { id: credentialAccount.id },
            data: { password: passwordHash },
        });
        } else {
        await transaction.account.create({
            data: {
            id: crypto.randomUUID(),
            accountId: existingUser.id,
            providerId: "credential",
            password: passwordHash,
            userId: existingUser.id,
            },
        });
        }

        return existingUser;
    });

    return Response.json(user);
}
export async function GET(request :NextRequest){
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session){
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const permission = await auth.api.userHasPermission({
        body: { permissions: { users: ["create"] } },
        headers: request.headers,
      });
      if (!permission.success) {
        return Response.json(
          { error: "You do not have permission to create milk records." },
          { status: 403 },
        );
      } 
    const pagenumber = request.nextUrl.searchParams.get("page")
        ? parseInt(request.nextUrl.searchParams.get("page") as string)
        : 1;
    const username = request.nextUrl.searchParams.get("username") ?? "";
    const mobile = request.nextUrl.searchParams.get("mobile") ?? "";
    const response = await getCachedUserRecords(username, mobile, pagenumber);
    return Response.json(response.records);
    
}

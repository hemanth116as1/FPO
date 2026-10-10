import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidateTag } from "next/cache";
import {NextRequest, NextResponse} from "next/server";
import getCachedMilkRecords, { tagMilkRecordsCache } from "./cache-milk-records";
type RecordValues = {
  date: Date;
  quantity: number;
  TimeType: "Morning" | "Evening";
};

function parseRecordValues(
  body: Record<string, unknown>,
): { data: RecordValues } | { error: string } {
  const { date, quantity, TimeType } = body;
  const parsedDate = typeof date === "string" ? new Date(date) : null;
  const dateParts =
    typeof date === "string" ? /^(\d{4}-\d{2}-\d{2})(?:$|T)/.exec(date) : null;
  const calendarDate = dateParts
    ? new Date(`${dateParts[1]}T00:00:00.000Z`)
    : null;
  if (
    !parsedDate ||
    Number.isNaN(parsedDate.getTime()) ||
    !dateParts ||
    !calendarDate ||
    calendarDate.toISOString().slice(0, 10) !== dateParts[1]
  ) {
    return { error: "date must be a valid date string." };
  }
  if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity <= 0) {
    return { error: "quantity must be a positive number." };
  }
  if (Math.abs(quantity * 100 - Math.round(quantity * 100)) >= 1e-8) {
    return { error: "quantity must have no more than two decimal places." };
  }
  if (TimeType !== "Morning" && TimeType !== "Evening") {
    return { error: "TimeType must be Morning or Evening." };
  }

  return { data: { date: parsedDate, quantity, TimeType } };
}

export async function GET(request: NextRequest) {
  var pagenumber = request.nextUrl.searchParams.get("page") ? (parseInt(request.nextUrl.searchParams.get("page") as string)) : 1;
  if (pagenumber < 1) {
    pagenumber = 1;
  }
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user.phoneNumberVerified) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const milkRecords = await getCachedMilkRecords(session.user.id,pagenumber);
    return Response.json(milkRecords, {
      headers: {
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    console.error("Error fetching milk records:", error);
    return Response.json(
      { error: "Unable to fetch milk records." },
      { status: 500, headers: { "Cache-Control": "private, no-cache" } },
    );
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user.phoneNumberVerified) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const permission = await auth.api.userHasPermission({
    body: { permissions: { milk: ["create"] } },
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

  const values = parseRecordValues(body as Record<string, unknown>);
  if ("error" in values) {
    return Response.json({ error: values.error }, { status: 400 });
  }

  try {
    const record = await prisma.milkRecord.create({
      data: {
        userId: session.user.id,
        ...values.data,
      },
    });

    revalidateTag(tagMilkRecordsCache(session.user.id), { expire: 0 });
    return Response.json(record, { status: 201 });
  } catch (error) {
    console.error("Error creating milk record:", error);
    return Response.json(
      { error: "Unable to create milk record." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user.phoneNumberVerified) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const permission = await auth.api.userHasPermission({
    body: { permissions: { milk: ["update"] } },
    headers: request.headers,
  });
  if (!permission.success) {
    return Response.json(
      { error: "You do not have permission to update milk records." },
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

  const recordId = (body as Record<string, unknown>).id;
  if (typeof recordId !== "string" || recordId.length === 0) {
    return Response.json({ error: "id is required." }, { status: 400 });
  }

  const values = parseRecordValues(body as Record<string, unknown>);
  if ("error" in values) {
    return Response.json({ error: values.error }, { status: 400 });
  }

  try {
    const result = await prisma.milkRecord.updateMany({
      where: { id: recordId, userId: session.user.id },
      data: values.data,
    });
    if (result.count === 0) {
      return Response.json({ error: "Milk record not found." }, { status: 404 });
    }

    const record = await prisma.milkRecord.findFirst({
      where: { id: recordId, userId: session.user.id },
    });
    if (!record) {
      return Response.json({ error: "Milk record not found." }, { status: 404 });
    }

    revalidateTag(tagMilkRecordsCache(session.user.id), { expire: 0 });
    return Response.json(record);
  } catch (error) {
    console.error("Error updating milk record:", error);
    return Response.json({ error: "Unable to update milk record." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user.phoneNumberVerified) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const permission = await auth.api.userHasPermission({
    body: { permissions: { milk: ["delete"] } },
    headers: request.headers,
  });
  if (!permission.success) {
    return Response.json(
      { error: "You do not have permission to delete milk records." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const recordId =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>).id
      : null;
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    typeof recordId !== "string" ||
    recordId.length === 0
  ) {
    return Response.json({ error: "A valid record id is required." }, { status: 400 });
  }

  try {
    const result = await prisma.milkRecord.deleteMany({
      where: {
        id: recordId,
        userId: session.user.id,
      },
    });
    if (result.count === 0) {
      return Response.json({ error: "Milk record not found." }, { status: 404 });
    }

    revalidateTag(tagMilkRecordsCache(session.user.id), { expire: 0 });
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting milk record:", error);
    return Response.json({ error: "Unable to delete milk record." }, { status: 500 });
  }
}

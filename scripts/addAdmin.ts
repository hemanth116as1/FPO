import "dotenv/config";
import prisma from "../lib/prisma";
import { auth } from "../lib/auth";

function normalizeIndianPhoneNumber(input: string) {
  const digits = input.replace(/\D/g, "");
  const nationalNumber =
    digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;

  if (!/^[6-9]\d{9}$/.test(nationalNumber)) {
    throw new Error("SUPER_ADMIN_PHONE must be a valid Indian mobile number");
  }

  return `+91${nationalNumber}`;
}

async function main() {
  const phoneInput = process.env.SUPER_ADMIN_PHONE;
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.SUPER_ADMIN_NAME?.trim();
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!phoneInput || !email || !name || !password) {
    throw new Error(
      "SUPER_ADMIN_PHONE, SUPER_ADMIN_EMAIL, SUPER_ADMIN_NAME, and SUPER_ADMIN_PASSWORD must be configured",
    );
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

    const emailOwner = await transaction.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });

    if (emailOwner && emailOwner.id !== existingUser?.id) {
      if (emailOwner.role !== "ADMIN" && emailOwner.role !== "SUPER_ADMIN") {
        throw new Error(
          "SUPER_ADMIN_EMAIL belongs to a non-admin user; refusing to delete it",
        );
      }

      const milkRecordCount = await transaction.milkRecord.count({
        where: { userId: emailOwner.id },
      });
      if (milkRecordCount > 0) {
        throw new Error(
          `The existing email owner has ${milkRecordCount} milk record(s); refusing to delete user data`,
        );
      }

      await transaction.user.delete({
        where: { id: emailOwner.id },
      });
      console.log("Removed previous admin account:", emailOwner.id);
    }

    if (!existingUser) {
      return transaction.user.create({
        data: {
          id: userId,
          name,
          email,
          role: "SUPER_ADMIN",
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

    await transaction.user.update({
      where: { id: existingUser.id },
      data: {
        name,
        email,
        role: "SUPER_ADMIN",
        phoneNumberVerified: true,
      },
    });

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

  console.log("Super Admin created or updated:", user.id);
}

main()
  .catch((error) => {
    console.error("Failed to create/update Super Admin:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

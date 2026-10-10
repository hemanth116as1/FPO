import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import {sendOTP} from "@/lib/twilio";
import {
  username,
  admin,
  phoneNumber,
} from "better-auth/plugins";

import prisma from "@/lib/prisma";

import {
  ac,
  basicUser,
  adminRole,
  superAdmin,
} from "@/app/api/auth/permissions";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  plugins: [
    username({
      immutableUsername: false,
    }),

    admin({
      ac,
      roles: {
        BASIC_USER: basicUser,
        ADMIN: adminRole,
        SUPER_ADMIN: superAdmin,
      },
      defaultRole: "BASIC_USER",
    }),

    phoneNumber({
      sendOTP: async ({ phoneNumber, code }) => {
        await sendOTP(phoneNumber, code);
      },
      sendPasswordResetOTP: async ({ phoneNumber, code }) => {
        await sendOTP(phoneNumber, code);
      },
      signUpOnVerification: {
        getTempEmail: (phoneNumber) =>
          `phone-${phoneNumber.replace(/\D/g, "")}@users.fpo.invalid`,
        getTempName: (phoneNumber) => phoneNumber,
      },
    }),
  ],
});
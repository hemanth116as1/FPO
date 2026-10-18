import {createAuthClient} from 'better-auth/react';
import {adminClient, phoneNumberClient} from "better-auth/client/plugins";
import {
  ac,
  basicUser,
  adminRole,
  superAdmin,
} from "@/app/api/auth/permissions";

export const authClient = createAuthClient({
    plugins: [ 
        adminClient({
      ac,
      roles: {
        BASIC_USER: basicUser,
        ADMIN: adminRole,
        SUPER_ADMIN: superAdmin,
      },
    }),
        phoneNumberClient(),],
    }
)
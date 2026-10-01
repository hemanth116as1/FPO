import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma"; 
import {username} from "better-auth/plugins"
import { admin } from "better-auth/plugins";
import {ac,basicUser,adminRole,superAdmin} from "@/app/api/auth/permissions"
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", 
    }),
    emailAndPassword: {
        enabled: true,
    },
    account: {
        additionalFields: {
            mobile: {
                type: "string",
                required: true,
                input: true,
            },
        },
    },
    plugins: [ 
        username({ immutableUsername: false, }), 
        admin({ ac, roles: { BASIC_USER: basicUser, ADMIN: adminRole, SUPER_ADMIN: superAdmin, }, 
        defaultRole: "BASIC_USER", }), ],
})

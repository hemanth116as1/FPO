import { createAccessControl } from "better-auth/plugins/access";

const statement = {
    milk: ["view", "create", "update", "delete", "viewAll"],
    users: ["view", "create", "update", "delete"],
    csv: ["import", "export"],
    audit: ["view"],
} as const;

export const ac = createAccessControl(statement);

export const basicUser = ac.newRole({
    milk: ["view"],
});

export const adminRole = ac.newRole({
    milk: ["view", "create", "update", "viewAll"],
    users: ["view"],
});

export const superAdmin = ac.newRole({
    milk: ["view", "create", "update", "delete", "viewAll"],
    users: ["view", "create", "update", "delete"],
    csv: ["import", "export"],
    audit: ["view"],
});
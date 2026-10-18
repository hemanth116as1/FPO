"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type AppRole = "BASIC_USER" | "ADMIN" | "SUPER_ADMIN";

function isAppRole(role: unknown): role is AppRole {
  return (
    role === "BASIC_USER" ||
    role === "ADMIN" ||
    role === "SUPER_ADMIN"
  );
}

export default function AddUserPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const role = session?.user.role;
  const canCreateMilk =
    isAppRole(role) &&
    authClient.admin.checkRolePermission({
      role,
      permissions: { users: ["create"] },
    });

  useEffect(() => {
    if (!isPending && (!session || !canCreateMilk)) {
      router.replace("/home");
    }
  }, [canCreateMilk, isPending, router, session]);

  if (isPending || !session || !canCreateMilk) {
    return <p role="status">Checking permissions...</p>;
  }

  return (
<h1>Add User</h1>
  );
}

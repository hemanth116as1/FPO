import {cacheLife, cacheTag} from "next/cache"
import prisma from "@/lib/prisma";
export function tagMilkRecordsCache(userId :string) {
    return "milk-records-" + userId;
}

export default async function getCachedMilkRecords(userId: string,pagenumber:number) {
    "use cache";
    const tag = tagMilkRecordsCache(userId);
    cacheLife("hours"); // Cache for 24 hours
    cacheTag(tag); // Tag the cache for invalidation
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            role:true
        },
    });
    const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";
    return prisma.milkRecord.findMany({
        where: {
            userId: isAdmin ? undefined : userId,
        },
        orderBy: {
            date: "desc",
        },
        skip: (pagenumber - 1) * 10, // Skip records for previous pages
        take: 10, // Limit to 10 records per page
    });
}
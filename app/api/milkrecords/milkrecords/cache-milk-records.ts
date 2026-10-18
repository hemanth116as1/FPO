import {cacheLife, cacheTag} from "next/cache"
import prisma from "@/lib/prisma";
export function tagMilkRecordsCache(userId :string) {
    return "milk-records-" + userId;
}

export function tagAllMilkRecordsCache() {
    return "milk-records-all";
}

export default async function getCachedMilkRecords(
    userId: string,
    pagenumber: number,
    isAdmin: boolean,
) {
    "use cache";
    const tag = tagMilkRecordsCache(userId);
    cacheLife("hours"); // Cache for 24 hours
    cacheTag(tag); // Tag the cache for invalidation
    if (isAdmin) {
        cacheTag(tagAllMilkRecordsCache());
    }
    const records = await prisma.milkRecord.findMany({
        where: {
            userId: isAdmin ? undefined : userId,
        },
        include: {
            user: {
                select: {
                    name: true,
                },
            },
        },
        orderBy: {
            date: "desc",
        },
        skip: (pagenumber - 1) * 10, // Skip records for previous pages
        take: 10, // Limit to 10 records per page
    });

    return {
        showUserName: isAdmin,
        records: records.map(({ user, ...record }) => ({
            ...record,
            ...(isAdmin ? { userName: user.name } : {}),
        })),
    };
}
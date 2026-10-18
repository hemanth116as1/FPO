import {cacheLife, cacheTag} from "next/cache"
import prisma from "@/lib/prisma";


export function tagUserRecords(page:number) {
    return "user-records-"+page;
}

export default async function getCachedUserRecords(
    userId: string,
    phone :string,
    pagenumber: number,
) {
    "use cache";
    const tag = tagUserRecords(pagenumber);
    cacheLife("hours"); // Cache for 24 hours
    cacheTag(tag); // Tag the cache for invalidation
    const records = await prisma.user.findMany({
        where: {
            userId: userId ? {
                contains:userId
            } : undefined,
            phoneNumber :phone?{
                contains:phone
            }:undefined,
        },
        skip: (pagenumber - 1) * 10, // Skip records for previous pages
        take: 10, // Limit to 10 records per page
    });

    return {records}
}
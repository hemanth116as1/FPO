"use server"
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
export async function POST(request: Request) {
    try {
        const data = await request.json();
        const digits = String(data.mobile ?? data.phonenumber ?? "").replace(/\D/g, "");
        const mobileNumber = digits.startsWith("91") && digits.length === 12
            ? digits.slice(2)
            : digits;
        if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
            return NextResponse.json(
                { success: false, message: "Invalid mobile number" },
                { status: 400 }
            );
        }
        const mobile = "+91" + mobileNumber;
        console.log("Received mobile number for OTP:", mobile);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const encryptedOTp = await bcrypt.hash(otp, 10);
        await prisma.oTP.create({
            data: {
                mobile: mobile,
                otp: encryptedOTp,
            },
        });
        return NextResponse.json({ success: true, message: "OTP created" });
    } catch (error) {
        console.error("Error sending OTP:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Invalid request payload",
            },
            { status: 400 }
        );
    }
}
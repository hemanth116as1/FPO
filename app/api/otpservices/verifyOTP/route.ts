"use server"
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const OTPData = String(data.otp ?? "");
        const digits = String(data.mobile ?? data.phonenumber ?? "").replace(/\D/g, "");
        const mobileNumber = digits.startsWith("91") && digits.length === 12
            ? digits.slice(2)
            : digits;
        const mobile = "+91" + mobileNumber;
        const OTPREcord = await prisma.oTP.findFirst({
            where: {
                mobile: mobile,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        if (!OTPREcord) {
            return NextResponse.json(
                {
                    success: false,
                    message: "No OTP record found for the provided mobile number",
                },
                { status: 404 }
            );
        }
        const isOTPValid = await bcrypt.compare(OTPData, OTPREcord.otp);
        const isExpired = new Date(OTPREcord.createdAt).getTime() + 5 * 60 * 1000 < Date.now();
        if (!isOTPValid || isExpired) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid OTP",
                },
                { status: 400 }
            );
        }
        return NextResponse.json(
            {
                success: true,
                message: "OTP verified successfully",
            },
            { status: 200 }
        );
        
    }
    catch (error) {
        console.error("Error verifying OTP:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Invalid request payload",
            },
            { status: 400 }
        );
    }
}
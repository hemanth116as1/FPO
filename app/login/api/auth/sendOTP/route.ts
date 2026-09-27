"use server"
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export async function POST(request: Request) {
    try {
        const data = await request.json();
        const mobile = "+91"+String(data.mobile ?? data.phonenumber ?? "");
        console.log("Received mobile number for OTP:", mobile);
        prisma.$connect();
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log("Generated OTP:", otp); 
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
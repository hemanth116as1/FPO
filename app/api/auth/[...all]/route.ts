"use server"

import {createAuthClient} from "better-auth/react"
const authClient = createAuthClient()
export async function signup(FormData: FormData) {
  const email = FormData.get("email") as string;
  const password = FormData.get("password") as string;
  const name = FormData.get("username") as string;
  const mobile = FormData.get("mobile") as string;
  const result = await authClient.signUp.email({
    email,
    password,
    name,
    mobile
  });
  return result;
  
}
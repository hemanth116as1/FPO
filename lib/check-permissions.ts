import {auth} from "./auth"
import {redirect} from "next/navigation"
export async function getPermission(action :"view" | "create" | "update" | "delete", headers:Headers){
    const session = auth.api.getSession({headers:headers});
    if (!session){
        redirect("/login")
    }
    return await auth.api.userHasPermission({
        body: { permissions: { users: [action] } },
        headers:headers,
      });
    

}
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validation/auth";
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost:true, session:{strategy:"jwt"}, pages:{signIn:"/login"},
  providers:[Credentials({credentials:{email:{},password:{}}, async authorize(raw){
    const parsed=loginSchema.safeParse(raw); if(!parsed.success) return null;
    const user=await db.user.findUnique({where:{email:parsed.data.email}});
    if(!user || user.disabledAt || !await bcrypt.compare(parsed.data.password,user.passwordHash)) return null;
    return {id:user.id,email:user.email,name:user.displayName,role:user.role};
  }})],
  callbacks:{
    jwt({token,user}) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({session,token}) {
      session.user.id = token.id as string;
      session.user.role = token.role as "USER" | "MODERATOR" | "ADMIN";
      return session;
    },
  }
});
import { RedirectType, redirect } from "next/navigation";

export default function AdminLoginPage() {
  redirect("/login?role=admin", RedirectType.replace);
}

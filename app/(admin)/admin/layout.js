import { notFound } from "next/navigation";
import { getUser } from "@/lib/server";
import { IS_MOCK_MODE } from "@/lib/mockData";

export default async function AdminLayout({ children }) {
  if (!IS_MOCK_MODE) {
    // 404 rather than redirect to /login: a redirect confirms to an
    // unauthenticated visitor that both the admin deck and a login page exist.
    const user = await getUser();
    if (!user) notFound();
  }
  return <>{children}</>;
}

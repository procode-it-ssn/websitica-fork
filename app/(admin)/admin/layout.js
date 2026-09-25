import { getUser } from "@/lib/server";
import { IS_MOCK_MODE } from "@/lib/mockData";

export default async function AdminLayout({ children }) {
  if (!IS_MOCK_MODE) {
    await getUser({ redirect: true });
  }
  return <>{children}</>;
}

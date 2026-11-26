import { useQuery } from "@tanstack/react-query";
import { ownedApi, QmapsRequestError, type QmapsUser } from "@/lib/ownedApi";

export const directoryAccountKey = ["qmaps-bookmark-account"] as const;

export async function currentDirectoryAccount() {
  try { return (await ownedApi<QmapsUser>("me")).id; }
  catch (error) {
    if (error instanceof QmapsRequestError && error.status === 401) return null;
    throw error;
  }
}

export const useDirectoryAccount = () => useQuery({
  queryKey: directoryAccountKey, queryFn: currentDirectoryAccount, retry: false, staleTime: 15000,
});

declare function useQuery<T>(options: {
  queryKey: readonly unknown[];
  queryFn: () => Promise<T>;
}): unknown;
declare function loadUser(id: string): Promise<{ id: string }>;
export const useUser = (userId: string) =>
  useQuery({
    queryKey: ["user", userId],
    queryFn: () => loadUser(userId),
  });

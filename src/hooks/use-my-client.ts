import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyClient } from "@/lib/portal.functions";
import { useMe } from "./use-me";

export function useMyClient() {
  const get = useServerFn(getMyClient);
  const me = useMe();
  return useQuery({
    queryKey: ["my-client"],
    enabled: !!me.data,
    queryFn: () => get(),
  });
}
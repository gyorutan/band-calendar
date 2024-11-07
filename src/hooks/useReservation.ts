import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export const useReservation = () => {
  const { data, isLoading, error, mutate } = useSWR(
    "/api/reservation",
    fetcher
  );

  return {
    data,
    isLoading,
    error,
    mutate,
  };
};

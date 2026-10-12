"use client";

import { useEffect } from "react";
import { useGetCurrentUserQuery } from "@/store/features/auth-api";
import { sessionLoaded, sessionLoading } from "@/store/features/auth-slice";
import { useAppDispatch } from "@/store/hooks";

export function AuthInitializer() {
  const dispatch = useAppDispatch();
  const { data, isSuccess, isError } = useGetCurrentUserQuery(undefined, {
    refetchOnMountOrArgChange: false,
  });

  useEffect(() => {
    if (!isSuccess && !isError) {
      dispatch(sessionLoading());
    }
  }, [dispatch, isSuccess, isError]);

  useEffect(() => {
    if (isSuccess) {
      dispatch(sessionLoaded(data.user));
    }
  }, [dispatch, data, isSuccess]);

  useEffect(() => {
    if (isError) {
      dispatch(sessionLoaded(null));
    }
  }, [dispatch, isError]);

  return null;
}

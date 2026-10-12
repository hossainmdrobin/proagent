"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { makeStore } from "./store";
import type { AppStore } from "./store";

export function Providers({ children }: { children: ReactNode }) {
  const [store] = useState<AppStore>(() => makeStore());

  return <Provider store={store}>{children}</Provider>;
}

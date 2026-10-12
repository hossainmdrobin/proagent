import { combineSlices, configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { baseApi } from "./base-api";
import { counterReducer } from "./features/counter-slice";
import { authReducer } from "./features/auth-slice";

const rootReducer = combineSlices({
  [baseApi.reducerPath]: baseApi.reducer,
  counter: counterReducer,
  auth: authReducer,
});

export function makeStore() {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  setupListeners(store.dispatch);

  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

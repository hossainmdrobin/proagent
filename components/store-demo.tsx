"use client";

import { useState } from "react";
import {
  useCreateAgentMutation,
  useGetAgentsQuery,
} from "@/store/features/agents-api";
import { decrement, increment, reset, selectValue } from "@/store/features/counter-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function StoreDemo() {
  const dispatch = useAppDispatch();
  const count = useAppSelector(selectValue);
  const { data: agents, isLoading, isFetching, isError, refetch } =
    useGetAgentsQuery();
  const [createAgent, { isLoading: isCreating }] = useCreateAgentMutation();
  const [name, setName] = useState("");

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim() === "") return;

    await createAgent({ name: name.trim(), role: "Operator" }).unwrap();
    setName("");
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col items-start gap-3">
        <h2 className="text-lg font-medium">createSlice</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">count: {count}</p>
        <div className="flex gap-2">
          <button
            className="rounded border border-black/[.08] px-3 py-1.5 text-sm dark:border-white/[.145]"
            onClick={() => dispatch(increment())}
          >
            +1
          </button>
          <button
            className="rounded border border-black/[.08] px-3 py-1.5 text-sm dark:border-white/[.145]"
            onClick={() => dispatch(decrement())}
          >
            -1
          </button>
          <button
            className="rounded border border-black/[.08] px-3 py-1.5 text-sm dark:border-white/[.145]"
            onClick={() => dispatch(reset())}
          >
            reset
          </button>
        </div>
      </section>

      <section className="flex flex-col items-start gap-3">
        <h2 className="text-lg font-medium">injectEndpoints</h2>
        <button
          className="rounded border border-black/[.08] px-3 py-1.5 text-sm dark:border-white/[.145]"
          onClick={() => refetch()}
        >
          refetch {isFetching && "(in flight)"}
        </button>

        {isLoading && <p className="text-sm">Loading agents...</p>}
        {isError && <p className="text-sm text-red-600">Failed to load agents.</p>}

        {agents && agents.length === 0 && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">No agents yet.</p>
        )}

        {agents && agents.length > 0 && (
          <ul className="flex flex-col gap-1 text-sm">
            {agents.map((agent) => (
              <li key={agent.id}>
                {agent.name} &mdash; {agent.role}
              </li>
            ))}
          </ul>
        )}

        <form className="flex items-center gap-2" onSubmit={handleCreate}>
          <input
            className="rounded border border-black/[.08] px-3 py-1.5 text-sm dark:border-white/[.145] dark:bg-transparent"
            placeholder="Agent name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <button
            className="rounded bg-foreground px-3 py-1.5 text-sm text-background disabled:opacity-50"
            disabled={isCreating}
            type="submit"
          >
            {isCreating ? "Creating..." : "Create agent"}
          </button>
        </form>
      </section>
    </div>
  );
}

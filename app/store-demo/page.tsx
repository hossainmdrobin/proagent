import { StoreDemo } from "@/components/store-demo";

export default function StoreDemoPage() {
  return (
    <main className="flex flex-1 w-full max-w-3xl flex-col gap-8 py-16 px-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        Redux Toolkit + RTK Query
      </h1>
      <StoreDemo />
    </main>
  );
}

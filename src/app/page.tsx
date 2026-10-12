import { site } from "@/lib/site";

export default function Home() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center">
      <h1 className="text-4xl">{site.name}</h1>
    </main>
  );
}

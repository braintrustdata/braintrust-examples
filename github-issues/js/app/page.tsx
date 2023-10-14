import GithubBox from "@/components/github-box";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex">
        <GithubBox />
      </div>
    </main>
  );
}

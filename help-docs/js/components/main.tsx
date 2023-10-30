"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { useCompletion } from "ai/react";

export default function Component() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [question, setQuestion] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  return (
    <div className="flex flex-col space-y-4 w-[600px]">
      <form
        className="flex items-center space-x-4"
        onSubmit={(e) => {
          e.preventDefault();
          setRefresh((r) => r + 1);
          setQuestion(inputRef.current?.value || null);
        }}
      >
        <Input
          className="flex-grow w-[400px]"
          placeholder="Enter question..."
          type="text"
          ref={inputRef}
        />
        <Button className="w-40" type="submit" variant="default">
          Fetch Contents
        </Button>
      </form>
      <div className="rounded-lg border border-zinc-200 border-dashed dark:border-zinc-800 overflow-auto w-full min-h-[400px]">
        {question ? (
          <Answer question={question} refresh={refresh} />
        ) : (
          <p className="p-4 text-zinc-600 dark:text-zinc-200">
            Answer will appear here...
          </p>
        )}
      </div>
    </div>
  );
}

export function Answer({
  question,
  refresh,
}: {
  question: string;
  refresh: number;
}) {
  const { complete, completion } = useCompletion({ api: "/api/completion" });

  useEffect(() => {
    complete(question || "");
  }, [complete, question, refresh]);

  return (
    <div className="p-4 w-full">
      <p className="text-zinc-600 dark:text-zinc-200 font-mono text-sm font-bold">
        <span className="bg-green-200">{completion}</span>
      </p>
    </div>
  );
}

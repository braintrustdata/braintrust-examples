"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IssueResponse } from "@/app/api/ghissue/route";
import { useRef, useState } from "react";

export default function Component() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [issue, setIssue] = useState<IssueResponse | null>(null);

  const fetchIssue = async () => {
    if (!inputRef.current?.value) {
      console.error("No URL provided");
      return;
    }
    const resp = await fetch(
      `/api/ghissue?url=${encodeURIComponent(inputRef.current?.value)}`
    );
    const { data } = await resp.json();
    console.log(data);
    setIssue(data);
  };

  return (
    <div className="flex flex-col space-y-4">
      <form
        className="flex items-center space-x-4"
        onSubmit={(e) => {
          e.preventDefault();
          fetchIssue();
        }}
      >
        <Input
          className="flex-grow w-[400px]"
          placeholder="Enter URL..."
          type="url"
          ref={inputRef}
        />
        <Button className="w-40" type="submit" variant="default">
          Fetch Contents
        </Button>
      </form>
      <div className="rounded-lg border border-zinc-200 border-dashed dark:border-zinc-800 overflow-auto">
        {issue ? (
          <TitleCompletion issue={issue} />
        ) : (
          <p className="p-4 text-zinc-600 dark:text-zinc-200">
            Stuff will appear here...
          </p>
        )}
      </div>
    </div>
  );
}

export function TitleCompletion({ issue }: { issue: IssueResponse }) {
  return (
    <div className="p-4">
      <p className="text-zinc-600 dark:text-zinc-200 font-mono text-sm font-bold">
        Original: {issue.data.title}
      </p>

      <p className="text-zinc-600 dark:text-zinc-200 font-mono text-sm font-bold">
        Revised:&nbsp; <span className="bg-green-200">{issue.data.title}</span>
      </p>

      <pre className="whitespace-pre-wrap mt-4 text-xs">{issue.data.body}</pre>
    </div>
  );
}

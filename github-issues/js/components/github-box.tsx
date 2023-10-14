import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Component() {
  return (
    <div className="flex flex-col space-y-4">
      <form className="flex items-center space-x-4">
        <Input
          className="flex-grow w-[400px]"
          placeholder="Enter URL..."
          type="url"
        />
        <Button className="w-40" type="submit" variant="default">
          Fetch Contents
        </Button>
      </form>
      <div className="h-64 rounded-lg border border-zinc-200 border-dashed dark:border-zinc-800 overflow-auto">
        <p className="p-4 text-zinc-600 dark:text-zinc-200">
          The fetched contents will appear here...
        </p>
      </div>
    </div>
  );
}

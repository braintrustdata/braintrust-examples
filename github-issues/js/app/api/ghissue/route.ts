import { Octokit } from "@octokit/core";
import { Endpoints } from "@octokit/types";

// Octokit.js
// https://github.com/octokit/core.js#readme
const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN!,
});

export type IssueResponse =
  Endpoints["GET /repos/{owner}/{repo}/issues/{issue_number}"]["response"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  // parse url of the form https://github.com/supabase/supabase/issues/15534
  const [owner, repo, _, issue_number] = url!.split("/").slice(-4);
  console.log({ owner, repo, issue_number });

  const data = await octokit.request(
    "GET /repos/{owner}/{repo}/issues/{issue_number}",
    {
      owner,
      repo,
      issue_number: parseInt(issue_number),
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  return Response.json({ data });
}

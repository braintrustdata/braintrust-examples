import * as fs from "fs";
import * as zlib from "zlib";
import * as util from "util";
import axios from "axios";

const N_ISSUES = 1;

const REPO = "supabase/supabase";

const CACHE_PATH = "./cache";
fs.mkdirSync(CACHE_PATH, { recursive: true });
export async function loadIssues() {
  const repo_fname = REPO.replace("/", "-") + ".json";
  const repo_cache = CACHE_PATH + "/" + repo_fname;
  const repo_url = `https://braintrust-public.s3.amazonaws.com/${repo_fname}.gz`;

  if (!fs.existsSync(repo_cache)) {
    try {
      const { data } = await axios.get(repo_url, {
        responseType: "arraybuffer",
      });
      const unzipped = await util.promisify(zlib.gunzip)(data);
      fs.writeFileSync(repo_cache, unzipped);
    } catch (e) {
      console.log(
        `Failed to download ${repo_url}. This script does not yet loading issues from unknown repos.`
      );
      process.exit(1);
    }
  }

  let issues = fs
    .readFileSync(repo_cache, "utf8")
    .split("\n")
    .filter((x) => x.length > 0)
    .map((x) => JSON.parse(x));

  console.log(`Loaded ${issues.length} issues from ${REPO}`);

  issues.sort((a, b) => {
    return (
      new Date(a.metadata.created_at).getTime() -
      new Date(b.metadata.created_at).getTime()
    );
  });

  issues = issues.filter((d) => !d.metadata.is_pull_request).slice(0, N_ISSUES);

  return issues;
}

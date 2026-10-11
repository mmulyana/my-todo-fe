export function repoName(url: string) {
  return url.split("/").pop() ?? url;
}

export async function main() {
  const repoUrl = `https://github.com/chuanqisun/memo.git/info/refs?service=git-upload-pack`;
  // console.log(import.meta.env.VITE_TOKEN);
  fetch(repoUrl, { headers: getPatHeader("chuanqisun", import.meta.env.VITE_TOKEN) })
    .then(toText)
    .then(console.log);
}

const toText = (r: any) => r.text() as string;

export const getPatHeader = (owner: string, token: string) => ({
  Authorization: `Basic ${window.btoa(`${owner}:${token}`)}`,
});

main();

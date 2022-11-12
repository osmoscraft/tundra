import * as isoGit from "isomorphic-git";

declare global {
  var git: typeof isoGit;
}

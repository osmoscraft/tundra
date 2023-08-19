import type { AsyncProxy } from "@tinykb/rpc-utils";
import type { DataWorkerRoutes } from "../../../workers/data-worker";
import { timestampToId } from "../../sync/path";
import { isAbsoluteUrl } from "../code-mirror-ext/live-link";
import type { CommandKeyBinding } from "../commands";
import type { OmnimenuElement } from "./omnimenu-element";

export interface HandleMenuInputConfig {
  commandBindings: CommandKeyBinding[];
  omnimenu: OmnimenuElement;
  proxy: AsyncProxy<DataWorkerRoutes>;
}

export async function handleMenuInput(
  { commandBindings, omnimenu, proxy }: HandleMenuInputConfig,
  e: CustomEvent<string>
) {
  const q = e.detail;
  if (q.startsWith(">")) {
    const command = q.slice(1).trim();
    const matchedCommands = commandBindings.filter((cmd) =>
      cmd.name.toLocaleLowerCase().startsWith(command.toLocaleLowerCase())
    );
    omnimenu.setMenuItems(
      matchedCommands.map((command) => ({
        title: `${[command.name, command.chord, command.key].filter(Boolean).join(" | ")}`,
        state: { command: command.run },
      }))
    );
  } else {
    const isLinking = q.startsWith(":");
    const searchTerms = isLinking ? q.slice(1).trim() : q.trim();
    const searchUrl = isAbsoluteUrl(searchTerms) ? searchTerms : undefined;

    if (searchTerms.length) {
      performance.mark("search-start");
      const notes = await proxy.searchNotes({ query: searchTerms, limit: 20 });
      const newNoteId = timestampToId(new Date());
      const newNoteUrl = searchUrl ? searchUrl : undefined;
      const newNoteTitle = searchUrl ? "Untitled" : searchTerms;
      const linkToId = isLinking ? newNoteId : undefined;
      const linkToUrl = isLinking && searchUrl ? searchUrl : undefined;

      omnimenu.setMenuItems([
        {
          title: `(New) ${searchTerms}`,
          state: { id: newNoteId, url: newNoteUrl, title: newNoteTitle, linkToId, linkToUrl },
        },
        ...notes.map((file) => ({
          title: file.meta?.title ?? "Untitled",
          state: {
            title: file.meta?.title ?? "Untitled",
            id: file.id,
            linkToId: isLinking ? file.id : undefined,
          },
        })),
      ]);
      console.log(`[perf] search latency ${performance.measure("search", "search-start").duration.toFixed(2)}ms`);
    } else {
      performance.mark("load-recent-start");
      const notes = await proxy.getRecentNotes();
      omnimenu.setMenuItems(
        notes.map((note) => ({
          title: note.meta?.title ?? "Untitled",
          state: {
            id: note.id,
            title: note.meta?.title ?? "Untitled",
            linkToId: isLinking ? note.id : undefined,
          },
        }))
      );
      console.log(
        `[perf] load recent latency ${performance.measure("search", "load-recent-start").duration.toFixed(2)}ms`
      );
    }
  }
}

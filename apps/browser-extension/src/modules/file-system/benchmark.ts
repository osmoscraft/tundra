import { destoryOpfsByPath, sqlite3Opfs } from "@tinykb/sqlite-utils";
import { clear, writeFile, writeFiles } from ".";
import { generateArticle } from "../devtool/generate-sample-content";
import SCHEMA from "./sql/schema.sql";

export async function runBenchmark() {
  function log(message: string) {
    return console.log("[benchmark]", message);
  }

  async function runHarness() {
    log("attempt to remove previous benchmark db");
    await destoryOpfsByPath("/tinykb-fs-bench.sqlite3")
      .then(() => log("removed"))
      .catch(() => log("nothing to remove"));

    log("init opfs");
    const db = await sqlite3Opfs("./sqlite3/jswasm/", "/tinykb-fs-bench.sqlite3");

    log("ensure schema");
    db.exec(SCHEMA);

    await runBench(db);
  }

  async function sequentialWrite(db: Sqlite3.DB, fileCount: number) {
    log(`generating ${fileCount} files`);
    const articles = [...generateArticle(1000, fileCount)];

    log(`sequential writing files`);
    performance.mark("start");
    for (let i = 0; i < articles.length; i++) {
      writeFile(db, `/test-${i}.md`, articles[i]);
    }
    const duration = performance.measure("duration", "start").duration;
    log(`total ${duration}ms | avg ${duration / fileCount}ms per file`);
  }

  async function sequentialWriteTx(db: Sqlite3.DB, fileCount: number) {
    log(`generating ${fileCount} files`);
    const articles = [...generateArticle(1000, fileCount)];

    log(`sequential writing files single transaction`);
    performance.mark("start");
    db.transaction(() => {
      for (let i = 0; i < articles.length; i++) {
        writeFile(db, `/test-${i}.md`, articles[i]);
      }
    });
    const duration = performance.measure("duration", "start").duration;
    log(`total ${duration}ms | avg ${duration / fileCount}ms per file`);
  }

  async function bulkWrite(db: Sqlite3.DB, fileCount: number) {
    log(`generating ${fileCount} files`);
    const articles = [...generateArticle(1000, fileCount)].map((content, i) => ({ path: `/test-${i}.md`, content }));

    log(`bulk writing files single transaction`);
    performance.mark("start");
    writeFiles(db, articles);
    const duration = performance.measure("duration", "start").duration;
    log(`total ${duration}ms | avg ${duration / fileCount}ms per file`);
  }

  async function bulkWriteChunkTx(db: Sqlite3.DB, fileCount: number, chunkSize: number) {
    log(`generating ${fileCount} files`);
    const articles = [...generateArticle(1000, fileCount)].map((content, i) => ({ path: `/test-${i}.md`, content }));

    log(`Divide into ${Math.ceil(fileCount / chunkSize)} chunks of size ${chunkSize}`);
    const chunks = articles.reduce(
      (acc, item) => {
        const chunk = acc[acc.length - 1];
        if (chunk.length === chunkSize) {
          acc.push([item]);
        } else {
          chunk.push(item);
        }
        return acc;
      },
      [[]] as { path: string; content: string }[][]
    );

    log(`bulk writing files single transaction`);
    performance.mark("start");
    db.transaction(() => {
      for (const chunk of chunks) {
        writeFiles(db, chunk);
      }
    });
    const duration = performance.measure("duration", "start").duration;
    log(`bulk writing done: total ${duration}ms | avg ${duration / fileCount}ms per file`);
  }

  async function bulkWriteChunkStreamTx(db: Sqlite3.DB, fileCount: number, chunkSize: number) {
    // pipelining file generation and db write
    log(`generating ${fileCount} files`);
    const generator = generateArticle(1000, fileCount);
    log(`bulk writing files chunk stream tx`);
    log(`Divide into ${Math.ceil(fileCount / chunkSize)} chunks of size ${chunkSize}`);

    let index = 0;
    performance.mark("start");
    db.transaction(() => {
      const chunkFiles: { path: string; content: string }[] = [];
      for (const item of generator) {
        chunkFiles.push({ path: `/test-${index}`, content: item });
        if (chunkFiles.length === chunkSize || index === fileCount - 1) {
          writeFiles(db, chunkFiles);
          chunkFiles.length = 0;
        }
        index++;
        if (index % 1000 === 0) {
          // log(`progress ${index} files`);
        }
      }
    });

    const duration = performance.measure("duration", "start").duration;
    log(`total ${duration}ms | avg ${duration / fileCount}ms per file`);
  }

  async function runBench(db: Sqlite3.DB) {
    await sequentialWrite(db, 100);
    await clear(db);
    await sequentialWriteTx(db, 10000);
    await clear(db);
    await bulkWrite(db, 10000);
    await clear(db);
    await bulkWriteChunkTx(db, 10000, 10);
    await clear(db);
    await bulkWriteChunkTx(db, 10000, 100);
    await clear(db);
    await bulkWriteChunkTx(db, 10000, 1000);
    await clear(db);
    await bulkWriteChunkStreamTx(db, 5_000, 100);
    await clear(db);
  }

  return runHarness()
    .then(() => {
      log("OK");
      return true;
    })
    .catch((e) => {
      console.error(e);
      return false;
    })
    .finally(() => destoryOpfsByPath("/tinykb-fs-bench.sqlite3").then(() => log("cleanup")));
}

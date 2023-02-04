import * as cheerio from "cheerio/lib/slim";

export const parseHtml = (html: string) => {
  const $ = cheerio.load(html);
  console.log($("a").length);

  const links: { href: string; text: string }[] = [];

  $("main a").each((i, el) => {
    const e = $(el);
    links.push({ href: e.attr("href")!, text: e.text()! });
  });

  return links;
};

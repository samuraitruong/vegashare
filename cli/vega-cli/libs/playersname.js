import * as cheerio from "cheerio";

export async function parsePlayersName(htmlContent) {
  const $ = cheerio.load(htmlContent);
  const rows = $("table.table-striped tbody tr");
  const data = [];

  rows.each((_, row) => {
    const cells = $(row).find("td");

    const playerData = {
      id: $(cells[0]).find("span").text().trim(),
      name: $(cells[1]).find("a").text().trim() || $(cells[1]).text().trim(),
      title: $(cells[1]).find("span").text().trim() || null,
      federation: $(cells[2]).find("img").attr("alt") || null,
      origin: $(cells[3]).text().trim() || null,
      rtg: $(cells[4]).text().trim(),
      rtgF: $(cells[5]).text().trim(),
      rtgN: $(cells[6]).text().trim(),
    };

    data.push(playerData);
  });

  return data;
}

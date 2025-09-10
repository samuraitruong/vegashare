import * as cheerio from "cheerio";

export async function parseFelovar(htmlContent) {
  const $ = cheerio.load(htmlContent);
  const rows = $("table.table-striped tbody tr");
  const data = [];

  rows.each((_, row) => {
    const cells = $(row).find("td");

    const felovarData = {
      rank: $(cells[0]).text().trim(),
      player: {
        name: $(cells[1]).find("a").text().trim(),
        fideId: $(cells[2]).text().trim(),
        federation: $(cells[3]).find("img").attr("alt") || null,
        title: $(cells[1]).find("span").text().trim() || null,
      },
      rating: $(cells[4]).text().trim(),
      games: $(cells[5]).text().trim(),
      points: $(cells[6]).text().trim(),
      aro: $(cells[7]).text().trim(),
      variation: $(cells[8]).text().trim(),
      rp: $(cells[9]).text().trim(),
    };

    data.push(felovarData);
  });

  return data;
}

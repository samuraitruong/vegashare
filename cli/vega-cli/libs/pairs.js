import * as cheerio from "cheerio";

export async function parsePairs(htmlContent) {
  const $ = cheerio.load(htmlContent);
  const rows = $("table.table-striped tbody tr");
  const data = [];

  rows.each((_, row) => {
    const cells = $(row).find("td");
    const whiteCell = $(cells[1]);
    const blackCell = $(cells[2]);

    const extractPlayerData = (cell) => {
      return {
        name: cell.find("span").text().trim(),
        id: cell.find("a").attr("href")?.split("#")[1] || null,
        title: cell.find(".title-box").text().trim() || null,
        rating: cell.find(".rating").text().trim(),
      };
    };

    const pairData = {
      board: $(cells[0]).text().trim(),
      white: extractPlayerData(whiteCell),
      black: extractPlayerData(blackCell),
      result: $(cells[3]).text().trim(),
    };
    data.push(pairData);
  });

  return data;
}

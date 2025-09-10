import * as cheerio from "cheerio";

export async function parseStandings(htmlContent) {
  const $ = cheerio.load(htmlContent);
  const rows = $("table.table-striped tbody tr");
  const data = [];

  rows.each((_, row) => {
    const cells = $(row).find("td");
    const nameCell = $(cells[1]);

    const standingData = {
      rank: $(cells[0]).text().trim(),
      name: nameCell.find("span").text().trim(),
      id: nameCell.find("a").attr("href")?.split("#")[1] || null,
      title: nameCell.find(".title-box").text().trim() || null,
      rating: nameCell.find(".rating").text().trim(),
      federation: $(cells[2]).text().trim(),
      points: $(cells[4]).text().trim(),
    };
    data.push(standingData);
  });

  return data;
}

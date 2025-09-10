function loadRatings(type = 'junior') {
  const file = type === 'junior'
    ? path.join(__dirname, '../public/junior-ratings.json')
    : path.join(__dirname, '../public/senior-ratings.json');
  if (!fs.existsSync(file)) return {};
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const ratings = {};
  for (const player of data.players) {
    ratings[player.name] = player.rating;
  }
  return ratings;
}

module.exports = { loadRatings };

const MOCK_DB = {
  items: [
    { title: "Свитер", folding_text: "Сложите свитер пополам, рукава внутрь.", folding_steps: ["Шаг 1", "Шаг 2"], image_url: "https://via.placeholder.com/300" },
    { title: "Джинсы", folding_text: "Сложите джинсы по шву, затем пополам.", folding_steps: ["Шаг 1", "Шаг 2"], image_url: null }
  ],
  locations: {},
  careTips: { "свитер": "Стирать при 30°C, не отжимать." }
};

module.exports = {
  async findFoldingInstruction(query) {
    return MOCK_DB.items.find(i => i.title.toLowerCase().includes(query.toLowerCase())) || null;
  },
  async saveLocation(userId, item, location) {
    MOCK_DB.locations[`${userId}_${item}`] = location;
  },
  async findLocation(userId, query) {
    const key = Object.keys(MOCK_DB.locations).find(k => k.includes(query));
    return key ? { location: MOCK_DB.locations[key] } : null;
  },
  async findCareTip(query) {
    return MOCK_DB.careTips[query.toLowerCase()] ? { washing_advice: MOCK_DB.careTips[query.toLowerCase()] } : null;
  }
};
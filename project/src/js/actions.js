// Здесь упрощённая версия без реального PostgreSQL
// Для SmartApp Code используем заглушки или внешний API

const MOCK_DB = {
  items: [
    {
      title: "свитер",
      folding_text: "Сложите свитер пополам вдоль, рукава заверните внутрь, затем сложите ещё раз пополам.",
      folding_steps: [
        "Разложите свитер на ровной поверхности",
        "Заверните правый рукав внутрь",
        "Заверните левый рукав внутрь",
        "Сложите свитер пополам вертикально",
        "Сложите ещё раз пополам"
      ],
      image_url: "https://via.placeholder.com/300x200?text=Свитер"
    },
    {
      title: "джинсы",
      folding_text: "Сложите джинсы пополам по шву, затем ещё раз пополам или втрое.",
      folding_steps: [
        "Сложите джинсы пополам по шву",
        "Разровняйте ткань",
        "Сложите пополам или втрое"
      ],
      image_url: null
    },
    {
      title: "футболка",
      folding_text: "Сложите футболку пополам вдоль, рукава заверните внутрь, затем сложите пополам или втрое.",
      folding_steps: [
        "Положите футболку лицевой стороной вниз",
        "Сложите пополам вдоль",
        "Заверните рукава",
        "Сложите пополам или втрое"
      ],
      image_url: "https://via.placeholder.com/300x200?text=Футболка"
    }
  ],

  careTips: {
    "свитер": { washing_advice: "Стирать вручную или в деликатном режиме", temperature: 30 },
    "джинсы": { washing_advice: "Стирать вывернутыми наизнанку", temperature: 40 },
    "футболка": { washing_advice: "Можно стирать в машинке", temperature: 40 }
  },

  locations: {}
};

module.exports = {
  getFoldingInstruction: (item) => {
    const found = MOCK_DB.items.find(i => i.title.includes(item.toLowerCase()));
    return found || null;
  },

  saveLocation: (item, location) => {
    MOCK_DB.locations[item.toLowerCase()] = location;
  },

  findLocation: (item) => {
    return MOCK_DB.locations[item.toLowerCase()] || null;
  },

  getLaundryTip: (item) => {
    return MOCK_DB.careTips[item.toLowerCase()] || null;
  }
};
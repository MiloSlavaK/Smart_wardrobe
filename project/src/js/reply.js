module.exports = {
  send_folding: (data) => {
    const sdkData = {
      type: 'FOLDING',
      title: data.title,
      steps: data.folding_steps || [],
      img: data.image_url
    };

    return {
      pronounceText: data.folding_text,
      items: [{ text: data.folding_text }],
      smart_app_data: sdkData
    };
  },

  confirm_location: (item, location) => {
    return {
      pronounceText: `Запомнила: ${item} теперь в ${location}.`,
      items: [{ text: `Запомнила: ${item} теперь в ${location}.` }]
    };
  },

  show_location: (item, location) => {
    return {
      pronounceText: `${item} находится: ${location}.`,
      items: [{ text: `${item} находится: ${location}.` }]
    };
  },

  location_unknown: (item) => {
    return {
      pronounceText: `Я не знаю, где лежит ${item}. Скажи мне, когда уберёшь.`,
      items: [{ text: `Я не знаю, где лежит ${item}.` }]
    };
  },

  send_laundry: (tip) => {
    const text = `Совет: ${tip.washing_advice}. Температура: ${tip.temperature}°C.`;
    return {
      pronounceText: text,
      items: [{ text }]
    };
  },

  no_tip: (item) => {
    return {
      pronounceText: `Для ${item} пока нет советов по стирке.`,
      items: [{ text: `Для ${item} пока нет советов.` }]
    };
  },

  not_found: (item) => {
    return {
      pronounceText: `Не нашла инструкцию для ${item}.`,
      items: [{ text: `Не нашла инструкцию для ${item}.` }]
    };
  },

  show_help: () => {
    return {
      pronounceText: "Я могу подсказать, как сложить вещи, запомнить где они лежат, или дать совет по стирке.",
      items: [{ text: "Спроси: 'Как сложить свитер?' или 'Где мои джинсы?'" }]
    };
  },

  show_default: () => {
    return {
      pronounceText: "Я не поняла. Спроси 'Помощь', чтобы узнать, что я умею.",
      items: [{ text: "Я не поняла. Спроси 'Помощь'." }]
    };
  }
};
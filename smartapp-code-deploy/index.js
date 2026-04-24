const { parseIntent } = require('./parser');
// db.js пока оставим, но см. примечание про БД ниже
const db = require('./db');

// Точка входа для SmartApp Code
module.exports = {
  async handleRequest(req, res) {
    try {
      const userText = req.payload?.message?.original_text || "";
      const userId = req.uuid?.userId || "anonymous";
      const { intent, item, extra } = parseIntent(userText);

      let responseText = "";
      let sdkData = null;

      if (intent === 'folding') {
        const data = await db.findFoldingInstruction(item);
        if (data) {
          responseText = data.folding_text;
          sdkData = { type: 'FOLDING', title: data.title, steps: data.folding_steps, img: data.image_url };
        } else {
          responseText = `Я пока не знаю, как складывать ${item}. Попробуйте что-то другое!`;
        }
      }
      else if (intent === 'remember') {
        await db.saveLocation(userId, item, extra);
        responseText = `Ок, запомнила: ${item} теперь в ${extra}.`;
      }
      else if (intent === 'where_is') {
        const loc = await db.findLocation(userId, item);
        responseText = loc ? `${item} находится здесь: ${loc.location}.` : `Я не помню, куда вы положили ${item}.`;
      }
      else if (intent === 'washing') {
        const tip = await db.findCareTip(item);
        responseText = tip ? tip.washing_advice : `Для ${item} советов по стирке не нашлось.`;
      }
      else {
        responseText = "Я могу подсказать, как сложить вещи или найти их. Просто спросите!";
      }

      // ✅ ВАЖНО: pronounceText вместо pronunciation
      res.json({
        messageName: "ANSWER_TO_USER",
        payload: {
          device: req.payload.device,
          items: [{ text: responseText }],
          pronounceText: responseText,
          smart_app_data: sdkData
        }
      });
    } catch (e) {
      console.error(e);
      res.json({
        messageName: "ANSWER_TO_USER",
        payload: {
          items: [{ text: "Произошла техническая ошибка." }],
          pronounceText: "Произошла техническая ошибка. Повторите позже."
        }
      });
    }
  }
};
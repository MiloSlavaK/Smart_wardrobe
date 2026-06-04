require: slotfilling/slotFilling.sc
  module = sys.zb-common

# Подключение javascript обработчиков
require: js/api.js
require: js/getters.js
require: js/reply.js
require: js/actions.js

# Подключение сценарных файлов
require: sc/main.sc

patterns:
    $AnyText = $nonEmptyGarbage

theme: /
    state: Start
        q!: $regex</start>
        q!: (запусти | открой | вруби) [гардероб | wardrobe | помощник*]
        a: Привет! Я помогу навести порядок в шкафу. Скажите, например: «добавь футболку», «как сложить джинсы» или «покажи список вещей».

    state: Fallback
        event!: noMatch
        script:
            // Кнопки озвучки в Canvas App шлют sendData({action:{action_id:"pronounce_text", parameters:{text}}}).
            // Сам Canvas App не умеет запускать TTS — озвучить должен сценарий своим ответом.
            var sa = get_server_action(get_request($context));
            var actionId = sa && (sa.action_id || sa.type);
            if (actionId === "pronounce_text" && sa.parameters && sa.parameters.text) {
                replyToUser(sa.parameters.text, $context);
            } else {
                replyToUser("Не удалось распознать команду. Попробуйте: «добавь футболку», «удали первую», «как сложить джинсы» или «выполнил свитер».", $context);
            }
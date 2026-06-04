function replyToUser(text, context) {
    var body = {
        pronounceText: text,
        auto_listening: true,
        finished: false,
        emotion: { emotionId: "igrivost" },
        items: [{ bubble: { text: text, markdown: false } }]
    };
    context.response.replies = context.response.replies || [];
    context.response.replies.push({ type: "raw", body: body });
}

function sendSmartAppData(action, context) {
    // Полезная нагрузка должна лежать в каноническом поле smart_app_data,
    // нестандартное поле action Салют при сериализации ответа отбрасывает.
    var command = { type: "smart_app_data", smart_app_data: action, action: action };
    context.response.replies = context.response.replies || [];
    context.response.replies.push({ type: "raw", body: { items: [{ command: command }] } });
}

function reply(body, response) {
    response.replies = response.replies || [];
    response.replies.push({ type: "raw", body: body });
}

function addAction(action, context) {
    // smart_app_data — каноническое поле для данных Canvas App; action дублируем для совместимости с фронтом
    var command = { type: "smart_app_data", smart_app_data: action, action: action };
    for (var i = 0; context.response.replies && i < context.response.replies.length; i++) {
        if (context.response.replies[i].type === "raw" &&
            context.response.replies[i].body &&
            context.response.replies[i].body.items) {
            context.response.replies[i].body.items.push({ command: command });
            return;
        }
    }
    reply({ items: [{ command: command }] }, context.response);
}

function addSuggestions(suggestions, context) {
    var buttons = suggestions.map(function(suggest) {
        return { action: { text: suggest, type: "text" }, title: suggest };
    });
    reply({ suggestions: { buttons: buttons } }, context.response);
}

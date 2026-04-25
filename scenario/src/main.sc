// Точка входа - приветствие
intent("привет|здравствуй|начни", function(p) {
    reply("Привет! Я помогу вам организовать шкаф. Скажите, какую вещь нужно сложить?", {
        tts: "Привет! Я помогу вам организовать шкаф. Скажите, какую вещь нужно сложить?"
    });
    addSuggestions([
        "Добавить футболку",
        "Сложить джинсы",
        "Что в шкафу?"
    ], context);
});

// Добавление вещи
intent("добавить {item}", function(p) {
    var itemName = p.value.item;
    var category = detectCategory(itemName);
    addClothing(itemName, category, context);
    var instruction = getInstruction(category);
    reply("Добавил " + itemName + ". " + instruction, {
        tts: "Добавил " + itemName + ". " + instruction
    });
});

intent("положить {item} в шкаф", function(p) {
    var itemName = p.value.item;
    var category = detectCategory(itemName);
    addClothing(itemName, category, context);
    reply("Хорошо, " + itemName + " добавлена.", {
        tts: "Хорошо, " + itemName + " добавлена."
    });
});

// Категории одежды
intent("(футболка|рубашка|свитер|кофта|блузка)", function(p) {
    var itemName = p.value.intent;
    addClothing(itemName, "верх", context);
    reply("Добавил " + itemName + " в категорию верх. Сложите её пополам вдоль, затем ещё раз пополам.", {
        tts: "Добавил " + itemName + " в категорию верх. Сложите её пополам вдоль, затем ещё раз пополам."
    });
});

intent("(брюки|джинсы|шорты|юбка)", function(p) {
    var itemName = p.value.intent;
    addClothing(itemName, "низ", context);
    reply("Добавил " + itemName + ". Сложите пополам по длине, затем втрое.", {
        tts: "Добавил " + itemName + ". Сложите пополам по длине, затем втрое."
    });
});

intent("носки", function(p) {
    addClothing("Носки", "носки", context);
    reply("Добавил носки. Сложите пару вместе и заверните один в другой.", {
        tts: "Добавил носки. Сложите пару вместе и заверните один в другой."
    });
});

// Выполнение
intent("(сложил|убрал|готово|выполнил) {item}", function(p) {
    var id = get_id_by_selected_item(request);
    if (id) {
        doneClothing(id, context);
        var texts = [
            "Отлично сложено! Теперь в шкафу порядок.",
            "Прекрасная работа! Вещь убрана на место.",
            "Молодец! Ваш шкаф становится аккуратнее."
        ];
        var idx = Math.floor(Math.random() * texts.length);
        _send_action_value("done", texts[idx]);
        reply(texts[idx], {tts: texts[idx]});
    } else {
        reply("Не удалось найти эту вещь. Попробуйте выбрать её из списка.", {
            tts: "Не удалось найти эту вещь. Попробуйте выбрать её из списка."
        });
    }
});

intent("я всё сложил|все вещи убраны", function(p) {
    reply("Замечательно! Ваш шкаф теперь в идеальном порядке. Нужна помощь с чем-то ещё?", {
        tts: "Замечательно! Ваш шкаф теперь в идеальном порядке. Нужна помощь с чем-то ещё?"
    });
});

// Удаление
intent("удалить {item}", function(p) {
    var id = get_id_by_selected_item(request);
    if (id) {
        deleteClothing(id, context);
        reply("Удалил " + p.value.item + " из списка.", {
            tts: "Удалил " + p.value.item + " из списка."
        });
    } else {
        reply("Не нашёл такую вещь. Уточните название.", {
            tts: "Не нашёл такую вещь. Уточните название."
        });
    }
});

// Вспомогательные функции
function detectCategory(itemName) {
    var name = itemName.toLowerCase();
    if (name.match(/(футболка|рубашка|свитер|кофта|блузка)/)) return "верх";
    if (name.match(/(брюки|джинсы|шорты|юбка)/)) return "низ";
    if (name.match(/(носки)/)) return "носки";
    if (name.match(/(нижнее|бельё|трусы)/)) return "нижнее";
    return "другое";
}

function getInstruction(category) {
    var instructions = {
        "верх": "Сложите пополам вдоль, затем ещё раз пополам",
        "низ": "Сложите пополам по длине, затем втрое",
        "нижнее": "Аккуратно сложите пополам",
        "носки": "Сложите вместе и заверните один в другой",
        "другое": "Аккуратно сложите и уберите"
    };
    return instructions[category] || instructions["другое"];
}
theme: /

    # === Добавление вещи ===
    state: ДобавитьВещь
        intent!: /add_clothing
        q!: * (добавь|добавить|положи|положить|запиши|закинь|внеси|сохрани) * $AnyText::itemName *
        script:
            var text = $request.rawRequest.payload.message.original_text || "";
            var name = extractItemName(text);
            if (!name) name = "вещь";
            replyToUser("Добавлено: " + name, $context);
            addAction({
                "type": "add_clothing",
                "name": name,
                "category": inferCategory(name)
            }, $context);

    # === Отметить как сложенную ===
    state: ВыполнитьВещь
        intent!: /done_clothing
        q!: * (выполнил|выполнила|сложил|сложила|сделал|сделала|убрал|готово) *
        script:
            var text = $request.rawRequest.payload.message.original_text || "";
            var item_id = get_id_by_selected_item(get_request($context));
            replyToUser("Готово!", $context);
            addAction({
                "type": "done_clothing",
                "id": item_id,
                "name": extractItemName(text)
            }, $context);

    # === Удаление вещи ===
    state: УдалитьВещь
        intent!: /delete_clothing
        q!: * (удали|удалить|убери|убрать|выброси|выбросить|сотри|стереть) *
        script:
            var text = $request.rawRequest.payload.message.original_text || "";
            var item_id = get_id_by_selected_item(get_request($context));
            replyToUser("Удалено.", $context);
            addAction({
                "type": "delete_clothing",
                "id": item_id,
                "name": extractItemName(text)
            }, $context);

    # === Список вещей (отвечает сам сценарий из состояния приложения) ===
    state: СписокВещей
        intent!: /list_items
        q!: * (что в шкафу|покажи список|покажи вещи|какие вещи|перечисли|мои вещи|весь список|показать гардероб) *
        script:
            var items = get_items(get_request($context)) || [];
            var msg;
            if (items.length === 0) {
                msg = "В вашем гардеробе пока нет вещей. Скажите, например: добавь футболку.";
            } else {
                var names = [];
                for (var i = 0; i < items.length; i++) {
                    names.push((i + 1) + ". " + items[i].title);
                }
                msg = "В вашем гардеробе " + items.length + " вещей: " + names.join(", ");
            }
            replyToUser(msg, $context);

    # === Поиск вещи (отвечает сам сценарий) ===
    state: НайтиВещь
        intent!: /find_item
        q!: * (найди|найти|ищи|поищи|ищу|проверь наличие|есть ли) * $AnyText::itemName *
        script:
            var text = $request.rawRequest.payload.message.original_text || "";
            var query = ($parseTree._itemName || extractItemName(text) || "").toLowerCase();
            var items = get_items(get_request($context)) || [];
            var found = [];
            for (var i = 0; i < items.length; i++) {
                if (items[i].title && items[i].title.toLowerCase().indexOf(query) !== -1) {
                    found.push(items[i].title);
                }
            }
            if (!query) {
                replyToUser("Что нужно найти?", $context);
            } else if (found.length) {
                replyToUser("Найдено: " + found.join(", "), $context);
            } else {
                replyToUser("Вещей «" + query + "» не найдено.", $context);
            }

    # === Инструкция по складыванию (ВСЯ ЛОГИКА ЗДЕСЬ) ===
    state: ИнструкцияСкладывания
        intent!: /speak_instruction
        q!: * (как сложить|как складывать|инструкци* по складыванию|метод складывания) * $AnyText::itemName *
        script:
            var text = $request.rawRequest.payload.message.original_text || "";
            var name = $parseTree._itemName || extractItemName(text) || "вещь";
            var n = name.toLowerCase();

            # Базовая инструкция по умолчанию (как 'другое' в вашем JS)
            var instr = "аккуратно сложите её по швам, избегая заломов.";

            # Простая логика выбора инструкции по ключевым словам (аналог clothingData.js)
            if (n.indexOf("футболк") != -1 || n.indexOf("рубашк") != -1 || n.indexOf("верх") != -1 || n.indexOf("плать") != -1) {
                instr = "сложите её пополам вдоль, затем ещё раз пополам, или повесьте на плечики.";
            } else if (n.indexOf("брюк") != -1 || n.indexOf("низ") != -1 || n.indexOf("джинс") != -1 || n.indexOf("штан") != -1) {
                instr = "сложите по швам, избегая заломов, и сушите на верёвке.";
            } else if (n.indexOf("носк") != -1) {
                instr = "сложите парой: один носок внутрь другого, не растягивая резинку.";
            } else if (n.indexOf("шерст") != -1 || n.indexOf("свитер") != -1 || n.indexOf("пуловер") != -1) {
                instr = "сложите плоско, не вешайте, так как шерсть тянется на плечиках.";
            } else if (n.indexOf("бель") != -1) {
                instr = "аккуратно сверните в рулон и храните при 30 градусах.";
            }

            # САЛЮТ ОЗВУЧИТ ЭТОТ ТЕКСТ (точно так же, как "Добавлено: ...")
            replyToUser("Чтобы сложить " + name + ", " + instr, $context);


    # === Совет по стирке (ВСЯ ЛОГИКА ЗДЕСЬ) ===
    state: СоветСтирки
        intent!: /speak_washing
        q!: * (как стирать|совет по стирке|режим стирки|температур* * стирк*) * $AnyText::itemName *
        script:
            var text = $request.rawRequest.payload.message.original_text || "";
            var name = $parseTree._itemName || extractItemName(text) || "вещь";
            var n = name.toLowerCase();

            var wash_instr = "следуйте инструкции на ярлычке.";

            if (n.indexOf("футболк") != -1 || n.indexOf("верх") != -1) {
                wash_instr = "стирайте при 30 градусах в деликатном режиме и сушите в расправленном виде.";
            } else if (n.indexOf("брюк") != -1 || n.indexOf("низ") != -1) {
                wash_instr = "можно стирать при 40 градусах с отжимом и сушить на верёвке.";
            } else if (n.indexOf("носк") != -1) {
                wash_instr = "стирайте при 40 градусах в обычном режиме, но не используйте отбеливатель.";
            } else if (n.indexOf("шерст") != -1 || n.indexOf("свитер") != -1) {
                wash_instr = "стирайте при 30 градусах в режиме «шерсть», сушите горизонтально и не отжимайте.";
            } else if (n.indexOf("обув") != -1 || n.indexOf("туфл") != -1) {
                wash_instr = "чистите влажной тканью, не стирайте в стиральной машине.";
            }

            # САЛЮТ ОЗВУЧИТ ЭТОТ ТЕКСТ
            replyToUser("Совет по стирке для " + name + ": " + wash_instr, $context);

    # === Напоминание об уходе ===
    state: Напоминание
        intent!: /set_reminder
        q!: * (напомни|напомнить|напоминание|запланир*|поставь дату) *
        script:
            var text = $request.rawRequest.payload.message.original_text || "";
            var item_id = get_id_by_selected_item(get_request($context));
            replyToUser("Хорошо, напоминание установлено.", $context);
            addAction({
                "type": "set_reminder",
                "id": item_id,
                "name": extractItemName(text),
                "date": ""
            }, $context);

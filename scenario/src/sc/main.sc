theme: /

state: Main
    # ➕ Добавление: "добавь футболку", "положи свитер категория верх"
    q: * (добавь|положи|запиши|новая) * [$name:WORD+] * [категория|$cat:WORD]? *
    script:
        var name = $parseTree._name || "вещь";
        var category = $parseTree._cat || "другое";
        var id = $utils.uuid();
        $reactions.answer("Добавила " + name + " в категорию " + category);
        $reactions.data({
            "type": "add_clothing",
            "payload": {
                "id": id,
                "name": name,
                "note": name,
                "category": category,
                "instruction": "Сложите аккуратно по швам",
                "washing": "Следуйте инструкции на ярлычке"
            }
        });

    # ✅ Отметка как убранная: "выполнил футболку", "я убрал первую вещь"
    q: * (выполнил|сделал|убрал|сложил) * [$num:NUMBER]? * [$name:WORD+]? *
    script:
        var number = $parseTree._num;
        var name = $parseTree._name;
        var item = null;
        if (number && $vars.closet && $vars.closet[number - 1]) {
            item = $vars.closet[number - 1];
        } else if (name && $vars.closet) {
            item = $vars.closet.find(i => i.name?.toLowerCase() == name?.toLowerCase());
        }
        if (item) {
            $reactions.answer("Отлично! " + item.name + " убрана.");
            $reactions.data({ "type": "done_clothing", "payload": { "id": item.id } });
        } else {
            $reactions.answer("Не нашла такую вещь. Попробуйте назвать номер или точное название.");
        }

    # ❌ Удаление: "удали футболку", "убери вторую вещь"
    q: * (удали|убери|сотри|вычеркни) * [$num:NUMBER]? * [$name:WORD+]? *
    script:
        var number = $parseTree._num;
        var name = $parseTree._name;
        var idx = -1;
        if (number) { idx = number - 1; }
        else if (name && $vars.closet) { idx = $vars.closet.findIndex(i => i.name?.toLowerCase() == name?.toLowerCase()); }
        if (idx >= 0 && $vars.closet && idx < $vars.closet.length) {
            var removed = $vars.closet.splice(idx, 1)[0];
            $reactions.answer("Удалила: " + removed.name);
            $reactions.data({ "type": "delete_clothing", "payload": { "id": removed.id } });
        } else {
            $reactions.answer("Не нашла, что удалить. Скажите номер или название.");
        }

    # 🔔 Напоминание: "напомни постирать футболку через неделю"
    q: * (напомни|напоминание) * [$name:WORD+] * [$date:DATE]? *
    script:
        var name = $parseTree._name;
        var date = $parseTree._date || "через 3 дня";
        var item = $vars.closet?.find(i => i.name?.toLowerCase() == name?.toLowerCase());
        if (item) {
            $reactions.answer("Напомню про " + item.name + ": " + date);
            $reactions.data({ "type": "set_reminder", "payload": { "id": item.id, "date": date } });
        } else {
            $reactions.answer("Не нашла \"" + name + "\". Сначала добавьте её в шкаф.");
        }

    # 🧼 Вопрос про стирку: "как стирать футболку?", "совет по уходу за свитером"
    q: * (как стирать|совет по стирке|уход за) * [$name:WORD+] *
    script:
        var name = $parseTree._name;
        var item = $vars.closet?.find(i => i.name?.toLowerCase() == name?.toLowerCase());
        if (item) {
            $reactions.answer("Для \"" + item.name + "\": " + item.washing);
            $reactions.data({ "type": "speak_washing", "payload": { "id": item.id } });
        } else {
            $reactions.answer("Не нашла \"" + name + "\" в вашем шкафу.");
        }

    # 🧵 Вопрос про складывание: "как сложить джинсы?", "инструкция для платья"
    q: * (как сложить|как убирать|инструкция для) * [$name:WORD+] *
    script:
        var name = $parseTree._name;
        var item = $vars.closet?.find(i => i.name?.toLowerCase() == name?.toLowerCase());
        if (item) {
            $reactions.answer("\"" + item.name + "\": " + item.instruction);
            $reactions.data({ "type": "speak_instruction", "payload": { "id": item.id } });
        } else {
            $reactions.answer("Добавьте \"" + name + "\" в шкаф, и я расскажу, как её сложить!");
        }

    # 📋 Список: "что в шкафу?", "покажи вещи"
    q: * (что в шкафу|покажи вещи|мой гардероб|список одежды) *
    script:
        if (!$vars.closet || $vars.closet.length == 0) {
            $reactions.answer("Ваш шкаф пока пуст. Давайте добавим первую вещь!");
        } else {
            var list = $vars.closet.map((c, i) => (i+1) + ". " + c.name + " (" + c.category + ")" + (c.completed ? " ✓" : "")).join("; ");
            $reactions.answer("В вашем шкафу: " + list);
        }

    # 🔍 Поиск: "найди свитер", "где футболка"
    q: * (найди|где|покажи) * [$name:WORD+] *
    script:
        var name = $parseTree._name;
        var item = $vars.closet?.find(i => i.name?.toLowerCase() == name?.toLowerCase());
        if (item) {
            $reactions.answer("Нашла: " + item.name + " — категория " + item.category + (item.completed ? ", уже убрана" : ""));
        } else {
            $reactions.answer("Не нашла \"" + name + "\" в вашем шкафу.");
        }

    # 🧹 Очистка выполненных
    q: * (очисти|удали) * [выполненные|сделанные|готовые] *
    script:
        if ($vars.closet) {
            $vars.closet = $vars.closet.filter(i => !i.completed);
            $reactions.answer("Выполненные вещи удалены.");
            $reactions.data({ "type": "clear_completed", "payload": {} });
        }

    # Fallback для нераспознанных фраз
    q: *
    script:
        $reactions.answer("Я помогаю убирать одежду в шкаф. Попробуйте: 'добавь футболку', 'как стирать свитер', 'напомни про куртку'.");
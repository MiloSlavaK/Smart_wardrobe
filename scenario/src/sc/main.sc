theme: /

state: Main
    # Добавление
    q: * (добавь|положи|запиши) * [$name:WORD+] * [категория|$cat:WORD]? *
    script:
        var name = $parseTree._name || "вещь";
        var category = $parseTree._cat || "другое";
        var id = $utils.uuid();
        
        $reactions.answer("Добавила " + name);
        
        # 🔥 Формат КАК В ШАБЛОНЕ:
        $reactions.data({
            "type": "smart_app_data",
            "action": {
                "type": "add_clothing",
                "id": id,
                "name": name,
                "category": category
            }
        });

    # Удаление
    q: * (удали|убери) * [$num:NUMBER] *
    script:
        var num = $parseTree._num;
        $reactions.answer("Удаляю номер " + num);
        $reactions.data({
            "type": "smart_app_data",
            "action": {
                "type": "delete_clothing",
                "number": num
            }
        });

    # Выполнение
    q: * (выполнил|сделал|убрал) * [$name:WORD+]? *
    script:
        var name = $parseTree._name;
        $reactions.answer("Отлично!");
        $reactions.data({
            "type": "smart_app_data",
            "action": {
                "type": "done_clothing",
                "name": name
            }
        });

    # Fallback
    q: *
    script:
        $reactions.answer("Попробуйте: 'добавь футболка', 'удали первую', 'выполнил свитер'");
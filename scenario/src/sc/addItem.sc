theme: /

    state: ДобавлениеЭлемента
        q!: (~добавить|~положить|положи|добавь|закинь|~напомнить)
            [~напоминание|~заметка]
            $AnyText::anyText

        random:
            a: Добавлено!
            a: Записано!

        script:
            log('addItem: context: ' + JSON.stringify($context))
            addItem($parseTree._anyText, $context);
            addSuggestions(["Добавь 'футболку'"], $context);
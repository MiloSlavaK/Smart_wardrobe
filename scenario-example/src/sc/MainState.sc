theme: /

state: MainState
    # Приветствие
    intent: greeting
        random:
            a: Привет! Я помогу вам навести порядок в шкафу. Скажите, какую вещь хотите сложить?
            a: Здравствуйте! Давайте вместе приведём ваш гардероб в порядок!
            a: Рад помочь! Какую одежду будем складывать сегодня?
        script:
            addSuggestions(["Добавить футболку", "Добавить брюки", "Показать все вещи"], $context);
    
    # Добавление вещи
    intent: add_clothing
        random:
            a: Отлично! Добавила вещь в ваш гардероб.
            a: Записано! Теперь давайте сложим её правильно.
            a: Вещь добавлена! Хотите получить инструкцию по складыванию?
        script:
            log('add_clothing triggered');
            addSuggestions(["Как сложить?", "Совет по стирке", "Добавить ещё"], $context);
    
    # Завершение
    intent: done_clothing
        random:
            a: Молодец! Вещь сложена аккуратно.
            a: Отлично! Теперь всё будет лежать ровно.
            a: Супер! Вы отлично справились.
        script:
            addSuggestions(["Добавить новую вещь", "Показать все вещи"], $context);
    
    # Удаление
    intent: delete_clothing
        random:
            a: Вещь удалена из гардероба.
            a: Убрала вещь из списка.
            a: Готово! Вещь больше не в списке.
    
    # Инструкция по складыванию
    intent: folding_instruction
        random:
            a: Вот инструкция по складыванию. Сложите вещь пополам, затем ещё раз пополам.
            a: Сейчас расскажу, как правильно сложить. Аккуратно разложите вещь и сложите втрое.
            a: Держите инструкцию: расправьте вещь, сложите рукава внутрь, затем пополам.
        script:
            addSuggestions(["Совет по стирке", "Готово", "Другая вещь"], $context);
    
    # Совет по стирке
    intent: washing_tip
        random:
            a: Вот совет по уходу за этой вещью. Стирайте при 30 градусах.
            a: Рекомендации по стирке: используйте деликатный режим.
            a: Обратите внимание на режим стирки: лучше стирать наизнанку.
        script:
            addSuggestions(["Как сложить?", "Напомнить об уходе", "Готово"], $context);
    
    # Прощание
    intent: goodbye
        random:
            a: Отличной вам организации пространства!
            a: Теперь у вас всё будет лежать аккуратно!
            a: Обращайтесь ещё за советами по уходу!

# Функция для кнопок
function addSuggestions(suggestions, context) {
    var buttons = [];
    suggestions.forEach(function(suggest) {
        buttons.push({
            action: {
                text: suggest,
                type: "text"
            },
            title: suggest
        });
    });
    var replyData = {
        type: "raw",
        body: {
            "suggestions": {
                "buttons": buttons
            }
        }
    };
    context.response.replies = context.response.replies || [];
    context.response.replies.push(replyData);
}
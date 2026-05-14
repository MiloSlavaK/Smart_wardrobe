# Обработка голосовых команд SmartApp Сбера

Этот документ описывает реализацию обработки голосовых команд для SmartApp Сбера в приложении "Помощник по складыванию одежды".

## 📁 Структура файлов

### Созданные файлы:

1. **`src/utils/smartAppHandler.js`** - Основной обработчик действий от SmartApp
2. **`src/utils/voiceCommands.js`** - Утилиты для работы с голосовыми командами
3. **`src/hooks/useAssistant.js`** - Обновлённый хук с интеграцией обработчика

### Существующие файлы (обновлённые):

- **`src/App.jsx`** - Интеграция контекста для обработчика SmartApp
- **`sberbot.json`** - Конфигурация интентов и команд SmartApp

## 🎤 Поддерживаемые голосовые команды

### 1. Добавление вещи (`add_clothing`)
```
"добавить вещь"
"новая одежда"
"положить в гардероб"
"складывай {item_name}"
"добавь {item_name}"
```

### 2. Отметка о выполнении (`done_clothing`)
```
"готово"
"сложил"
"выполнил"
"вещь готова"
"отметить выполненным"
```

### 3. Удаление вещи (`delete_clothing`)
```
"удалить вещь"
"убрать одежду"
"удали {item_name}"
"выбросить вещь"
```

### 4. Установка напоминания (`set_reminder`)
```
"напомнить об уходе"
"установить напоминание"
"постирать {item_name}"
"напомни про уход"
```

### 5. Озвучивание инструкции (`speak_instruction`)
```
"как сложить"
"расскажи как складывать"
"инструкция по складыванию"
"озвучь инструкцию"
```

### 6. Озвучивание совета по стирке (`speak_washing`)
```
"как стирать"
"совет по стирке"
"режим стирки"
"озвучь совет по стирке"
```

## 🔧 Как это работает

### 1. Обработчик действий (`smartAppHandler.js`)

Функция `handleSmartAppAction(action, context)` принимает:
- `action` - объект действия от SmartApp с `action_id` и `parameters`
- `context` - контекст с методами управления данными (`addItem`, `toggleItemCompleted`, etc.)

Возвращает объект результата:
```javascript
{
  success: true/false,
  message: "Текстовое описание результата",
  speak: "Текст для озвучивания",
  data: { ... } // Дополнительные данные
}
```

### 2. Хук useAssistant

Обновлённый хук теперь:
- Принимает `context` для доступа к данным
- Автоматически обрабатывает действия через `handleSmartAppAction`
- Озвучивает ответы через Web Speech API
- Предоставляет метод `sendSmartAppResponse` для отправки ответов

### 3. Интеграция в App.jsx

```javascript
const smartAppContext = {
  items,
  addItem,
  toggleItemCompleted,
  deleteItem,
  updateReminder,
};

const { assistant, updateState, sendActionValue, sendSmartAppResponse } = 
  useAssistant(handleAssistantAction, smartAppContext);
```

## 📝 Примеры использования

### Добавление вещи голосом:
```
Пользователь: "Добавь синюю футболку"
→ action_id: add_clothing
→ parameters: { name: "синяя футболка", category: "верх" }
→ Результат: Вещь добавлена, озвучено: "Добавлена вещь: синяя футболка"
```

### Отметка о выполнении:
```
Пользователь: "Готово"
→ action_id: done_clothing
→ parameters: { id: "demo-1" }
→ Результат: Вещь отмечена, озвучено: "Отлично! Вещь отмечена как сложенная"
```

### Запрос инструкции:
```
Пользователь: "Как сложить свитер?"
→ action_id: speak_instruction
→ parameters: { id: "item-123" }
→ Результат: Озвучено: "Как сложить свитер: Сложите пополам, рукава к центру..."
```

## 🛠️ Утилиты voiceCommands.js

### parseRelativeDate(text)
Распознаёт относительные даты из текста:
```javascript
parseRelativeDate("завтра") // → "2024-01-15"
parseRelativeDate("через неделю") // → "2024-01-21"
```

### detectCategoryFromText(text)
Определяет категорию вещи из текста:
```javascript
detectCategoryFromText("шерстяной свитер") // → "шерсть"
detectCategoryFromText("джинсы") // → "низ"
```

### extractItemNameFromCommand(text)
Извлекает название вещи из команды:
```javascript
extractItemNameFromCommand("добавь синюю футболку") // → "синяя футболка"
```

### generateAssistantResponse(action, result)
Генерирует случайный ответ ассистента:
```javascript
generateAssistantResponse('add_clothing', { success: true })
// → "Вещь успешно добавлена!"
```

## ⚙️ Настройка в sberbot.json

Конфигурация содержит:
- **intents** - шаблоны фраз для распознавания
- **slots** - параметры для извлечения из фраз
- **commands** - маппинг интентов на действия

## 🚀 Развёртывание

1. Убедитесь, что переменные окружения настроены:
   ```
   REACT_APP_TOKEN=ваш_токен
   REACT_APP_SMARTAPP=название_смартрапа
   ```

2. Для локальной разработки используйте SmartApp Debugger:
   ```javascript
   createSmartappDebugger({
     token: process.env.REACT_APP_TOKEN,
     initPhrase: `Запусти ${process.env.REACT_APP_SMARTAPP}`,
   });
   ```

3. Протестируйте голосовые команды через:
   - Салют Девушку (устройства Sber)
   - SmartApp Debugger в браузере

## 📋 Чеклист проверки

- [x] Создан `smartAppHandler.js` с обработкой всех интентов
- [x] Создан `voiceCommands.js` с утилитами
- [x] Обновлён `useAssistant.js` с интеграцией обработчика
- [x] Обновлён `App.jsx` с передачей контекста
- [x] Настроен `sberbot.json` с интентами
- [x] Добавлено голосовое озвучивание ответов
- [x] Поддержка относительных дат для напоминаний
- [x] Авто-определение категории вещи

## 🔗 Полезные ссылки

- [Документация SaluteJS](https://salutejs.sber.ru/)
- [SmartApp Code (Сбер)](https://smartapp-code.sber.ru/)
- [Salute Developers](https://developers.sber.ru/docs/ru/salute-assistant/smartapps)

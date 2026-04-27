import React from 'react';
import { createAssistant, createSmartappDebugger } from '@salutejs/client';
import './App.css';
import { TaskList } from './pages/TaskList';

// Безопасная инициализация ассистента
const initializeAssistant = (getState) => {
  // Проверяем, запущены ли мы в режиме разработки И есть ли необходимые переменные
  const isDev = process.env.NODE_ENV === 'development';
  const hasToken = process.env.REACT_APP_TOKEN;
  const hasSmartApp = process.env.REACT_APP_SMARTAPP;

  if (isDev && hasToken && hasSmartApp) {
    try {
      return createSmartappDebugger({
        token: process.env.REACT_APP_TOKEN,
        initPhrase: `Запусти ${process.env.REACT_APP_SMARTAPP}`,
        getState,
        nativePanel: {
          defaultText: 'Добавьте вещь...',
          screenshotMode: false,
          tabIndex: -1,
        },
      });
    } catch (e) {
      console.warn('SmartApp Debugger init failed:', e);
      // Fallback к обычному ассистенту при ошибке
      return createAssistant({ getState });
    }
  }

  // В продакшене или если нет переменных — используем обычный ассистент
  return createAssistant({ getState });
};

export class App extends React.Component {
  constructor(props) {
    super(props);

    // Начальные данные с инструкциями по умолчанию
    this.state = {
      items: [
        {
          id: 'demo-1',
          name: 'Футболка',
          category: 'верх',
          instruction: 'Сложите пополам вдоль, затем ещё раз пополам',
          washing: '30°C, деликатный режим',
          nextReminder: '',
          completed: false
        }
      ],
    };

    // Инициализируем ассистента с обработкой ошибок
    try {
      this.assistant = initializeAssistant(() => this.getStateForAssistant());

      this.assistant.on('data', (event) => {
        if (event.type === 'character') {
          console.log(`character: "${event?.character?.id}"`);
        } else {
          const { action } = event;
          if (action) this.dispatchAssistantAction(action);
        }
      });
    } catch (error) {
      console.error('Failed to initialize assistant:', error);
      // Создаём заглушку, чтобы приложение не падало
      this.assistant = {
        on: () => {},
        sendData: () => () => {},
        getInitialData: () => ({}),
      };
    }
  }

  getStateForAssistant() {
    return {
      item_selector: {
        items: this.state.items.map(({ id, name, category }, index) => ({
          number: index + 1,
          id,
          title: name,
          subtitle: category,
        })),
        ignored_words: [
          'добавить', 'положить', 'складывай', 'новая', 'вещь', 'одежда',
          'удалить', 'убрать', 'выполнил', 'готово', 'сделал', 'сложил',
          'напомнить', 'постирать', 'уход'
        ],
      },
    };
  }

  dispatchAssistantAction(action) {
    if (!action) return;

    switch (action.type) {
      case 'add_clothing': return this.addClothing(action);
      case 'done_clothing': return this.doneClothing(action);
      case 'delete_clothing': return this.deleteClothing(action);
      case 'set_reminder': return this.setReminder(action);
      default:
        console.log('Unknown action type:', action.type);
    }
  }

  getDefaultInstruction(category) {
    const instructions = {
      'верх': 'Сложите пополам вдоль, затем ещё раз пополам',
      'низ': 'Сложите пополам по длине, затем втрое',
      'нижнее': 'Аккуратно сложите пополам',
      'носки': 'Сложите вместе и заверните один в другой',
      'шерсть': 'Сложите пополам, рукава к центру, не вешать!',
      'другое': 'Аккуратно сложите и уберите в шкаф'
    };
    return instructions[category] || instructions['другое'];
  }

  getDefaultWashing(category) {
    const washing = {
      'верх': '30°C, деликатный режим. Сушить в расправленном виде.',
      'низ': 'Вывернуть наизнанку. 30-40°C.',
      'нижнее': 'Ручная стирка или деликатный режим.',
      'носки': 'Стирать в мешочке при 40°C.',
      'шерсть': 'Только ручная стирка. Сушить горизонтально!',
      'другое': 'Стирать согласно ярлыку.'
    };
    return washing[category] || washing['другое'];
  }

  addClothing(action) {
    this.setState({
      items: [
        ...this.state.items,
        {
          id: Math.random().toString(36).substring(7),
          name: action.name,
          category: action.category || 'другое',
          instruction: action.instruction || this.getDefaultInstruction(action.category),
          washing: action.washing || this.getDefaultWashing(action.category),
          nextReminder: action.nextReminder || '',
          completed: false,
        },
      ],
    });
  }

  doneClothing(action) {
    this.setState({
      items: this.state.items.map((item) =>
        item.id === action.id ? { ...item, completed: !item.completed } : item
      ),
    });
  }

  deleteClothing(action) {
    this.setState({
      items: this.state.items.filter(({ id }) => id !== action.id),
    });
  }

  setReminder(action) {
    this.setState({
      items: this.state.items.map((item) =>
        item.id === action.id ? { ...item, nextReminder: action.date } : item
      ),
    });
  }

  _sendActionValue(actionId, value) {
    if (!this.assistant?.sendData) return;

    const data = {
      action: { action_id: actionId, parameters: { value } },
    };
    const unsubscribe = this.assistant.sendData(data, (data) => {
      console.log('sendData onData:', data);
      unsubscribe?.();
    });
  }

  playSuccessMessage(id) {
    const completed = this.state.items.find(({ id: itemId }) => itemId === id)?.completed;
    if (!completed) {
      const texts = ['Отлично сложено!', 'Прекрасная работа!', 'Теперь в шкафу порядок!'];
      const idx = Math.floor(Math.random() * texts.length);
      this._sendActionValue('done', texts[idx]);
    }
  }

  render() {
    return (
      <TaskList
        items={this.state.items}
        onAdd={(name, category, instruction, washing, nextReminder) => {
          this.addClothing({
            type: 'add_clothing',
            name,
            category,
            instruction,
            washing,
            nextReminder
          });
        }}
        onDone={(item) => {
          this.playSuccessMessage(item.id);
          this.doneClothing({ type: 'done_clothing', id: item.id });
        }}
        onDelete={(item) => {
          this.deleteClothing({ type: 'delete_clothing', id: item.id });
        }}
        onUpdateReminder={(id, date) => {
          this.setReminder({ type: 'set_reminder', id, date });
        }}
      />
    );
  }
}
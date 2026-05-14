import React from 'react';
import { TaskList } from './pages/TaskList';
import { useClosetItems } from './hooks/useClosetItems';
import { useAssistant, ASSISTANT_IGNORED_WORDS } from './hooks/useAssistant';
import { useSuccessMessage } from './hooks/useSpeech';
import './App.css';

const DEMO_ITEM = {
  id: 'demo-1',
  name: 'Футболка',
  category: 'верх',
  instruction: 'Сложите пополам вдоль, затем ещё раз пополам',
  washing: '30°C, деликатный режим. Сушить в расправленном виде.',
  nextReminder: '',
  completed: false,
};

export const App = () => {
  const { items, addItem, toggleItemCompleted, deleteItem, updateReminder } = useClosetItems([DEMO_ITEM]);

  // Контекст для обработчика SmartApp
  const smartAppContext = {
    items,
    addItem,
    toggleItemCompleted,
    deleteItem,
    updateReminder,
  };

  const handleAssistantAction = (action) => {
    switch (action.type || action.action_id) {
      case 'add_clothing':
        addItem({
          name: action.name || action.parameters?.name,
          category: action.category || action.parameters?.category,
          instruction: action.instruction,
          washing: action.washing,
          nextReminder: action.nextReminder,
        });
        break;
      case 'done_clothing':
        toggleItemCompleted(action.id || action.parameters?.id);
        break;
      case 'delete_clothing':
        deleteItem(action.id || action.parameters?.id);
        break;
      case 'set_reminder':
        updateReminder(action.id || action.parameters?.id, action.date || action.parameters?.date);
        break;
      default:
        console.log('Unknown action type:', action.type || action.action_id);
    }
  };

  const { assistant, updateState, sendActionValue, sendSmartAppResponse } = useAssistant(handleAssistantAction, smartAppContext);

  const { playSuccessMessage } = useSuccessMessage(sendActionValue);

  const getStateForAssistant = () => ({
    item_selector: {
      items: items.map(({ id, name, category }, index) => ({
        number: index + 1,
        id,
        title: name,
        subtitle: category,
      })),
      ignored_words: ASSISTANT_IGNORED_WORDS,
    },
  });

  updateState(getStateForAssistant);

  return (
    <TaskList
      items={items}
      onAdd={addItem}
      onDone={(item) => {
        playSuccessMessage(item.id, items);
        toggleItemCompleted(item.id);
      }}
      onDelete={(item) => deleteItem(item.id)}
      onUpdateReminder={(id, date) => updateReminder(id, date)}
    />
  );
};

import React from 'react';
import { AddTask } from '../components/AddTask';
import { TaskItemList } from '../components/TaskItemList';

export const TaskList = (props) => {
  const { items, onAdd, onDone, onDelete, onUpdateReminder } = props;
  
  return (
    <main className="container">
      <header className="header">
        <h1>🗂️ Помощник по складыванию одежды</h1>
        <p className="subtitle">Организуйте свой шкаф с умным помощником</p>
      </header>

      <AddTask onAdd={onAdd} />

      <section className="task-section">
        <h2>Ваши вещи</h2>
        <TaskItemList 
          items={items} 
          onDone={onDone} 
          onDelete={onDelete} 
          onUpdateReminder={onUpdateReminder}
        />
      </section>
    </main>
  );
};

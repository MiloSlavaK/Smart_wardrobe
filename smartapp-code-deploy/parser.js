function parseIntent(text) {
  const t = text.toLowerCase().trim();

  // Намерение: Сложить
  const foldMatch = t.match(/(?:как\s+)?слож(?:ить|у|ишь|уть)\s+(.+)/);
  if (foldMatch) return { intent: 'folding', item: foldMatch[1].trim() };

  // Намерение: Запомнить место
  const remMatch = t.match(/(?:я\s+)?положил(?:а)?\s+(.+)\s+в\s+(.+)/) ||
                   t.match(/запомни(?:ть)?\s*[:]?\s*(.+)\s+в\s+(.+)/);
  if (remMatch) return { intent: 'remember', item: remMatch[1].trim(), extra: remMatch[2].trim() };

  // Намерение: Найти вещь
  const whereMatch = t.match(/(?:где|найди|куда\s+я\s+положил)\s+(.+)/);
  if (whereMatch) return { intent: 'where_is', item: whereMatch[1].trim() };

  // Намерение: Стирка
  const washMatch = t.match(/(?:как\s+(?:стирать|ухаживать|отстирать|постирать)|режим\s+стирки\s+(?:для|у)\s+)(.+)/);
  if (washMatch) return { intent: 'washing', item: washMatch[1].trim() };

  if (/(?:что\s+ты\s+умеешь|помощь|help|команды)/.test(t)) return { intent: 'help' };

  return { intent: 'unknown' };
}

module.exports = { parseIntent };
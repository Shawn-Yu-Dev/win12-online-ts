export interface TaskbarLayout {
  display: 'none' | 'flex';
  width: number;
}

export function getTaskbarLayout(count: number): TaskbarLayout {
  return {
    display: count == 0 ? 'none' : 'flex',
    width: 4 + count * (34 + 4),
  };
}

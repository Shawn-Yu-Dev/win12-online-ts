type CellValue = number | 'mine';

const gridElement = document.getElementById('grid') as HTMLElement;
const minesLeftElement = document.getElementById('mines-left') as HTMLElement;
const resetButton = document.getElementById(
  'reset-button',
) as HTMLButtonElement;
const timerElement = document.getElementById('timer') as HTMLElement;
const modal = document.getElementById('modal') as HTMLElement;
const restartButton = document.getElementById(
  'restart-button',
) as HTMLButtonElement;
const modalMessage = document.getElementById('modal-message') as HTMLElement;
const difficultyButtons = document.querySelectorAll<HTMLButtonElement>(
  '.difficulty-selector button[data-difficulty]',
);
const customButton = document.getElementById(
  'custom-button',
) as HTMLButtonElement;

let grid: CellValue[][] = [];
let rows = 9;
let cols = 9;
let mines = 10;
let minesLeft = mines;
let isGameOver = false;
let timerInterval: number | null = null;
let seconds = 0;
let firstClick = true;

function createGrid(): void {
  grid = Array.from({ length: rows }, () => Array<CellValue>(cols).fill(0));
}

function placeMines(initialRow: number, initialCol: number): void {
  let minesPlaced = 0;
  while (minesPlaced < mines) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);
    if (
      grid[row][col] !== 'mine' &&
      (row !== initialRow || col !== initialCol)
    ) {
      grid[row][col] = 'mine';
      minesPlaced++;
    }
  }
}

function calculateNumbers(): void {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row][col] === 'mine') continue;
      let count = 0;
      for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
        for (let colOffset = -1; colOffset <= 1; colOffset++) {
          const neighborRow = row + rowOffset;
          const neighborCol = col + colOffset;
          if (
            neighborRow >= 0 &&
            neighborRow < rows &&
            neighborCol >= 0 &&
            neighborCol < cols &&
            grid[neighborRow][neighborCol] === 'mine'
          ) {
            count++;
          }
        }
      }
      grid[row][col] = count;
    }
  }
}

function renderGrid(): void {
  gridElement.replaceChildren();
  gridElement.style.gridTemplateColumns = `repeat(${cols}, 30px)`;
  const fragment = document.createDocumentFragment();
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.addEventListener('click', handleCellClick);
      cell.addEventListener('contextmenu', handleCellRightClick);
      fragment.appendChild(cell);
    }
  }
  gridElement.appendChild(fragment);
}

function handleCellClick(event: MouseEvent): void {
  if (isGameOver) return;
  const cell = event.currentTarget as HTMLDivElement;
  const row = Number(cell.dataset.row);
  const col = Number(cell.dataset.col);
  if (firstClick) {
    placeMines(row, col);
    calculateNumbers();
    firstClick = false;
    startTimer();
  }
  if (cell.classList.contains('flagged')) return;
  revealCell(row, col);
}

function handleCellRightClick(event: MouseEvent): void {
  event.preventDefault();
  if (isGameOver) return;
  const cell = event.currentTarget as HTMLDivElement;
  toggleFlag(cell);
}

function toggleFlag(cell: HTMLDivElement): void {
  if (cell.classList.contains('revealed')) return;
  if (cell.classList.contains('flagged')) {
    cell.classList.remove('flagged');
    minesLeft++;
  } else if (minesLeft > 0) {
    cell.classList.add('flagged');
    minesLeft--;
  }
  minesLeftElement.textContent = String(minesLeft);
}

function revealCell(row: number, col: number): void {
  if (row < 0 || row >= rows || col < 0 || col >= cols) return;
  const cell = document.querySelector<HTMLDivElement>(
    `[data-row="${row}"][data-col="${col}"]`,
  );
  if (
    !cell ||
    cell.classList.contains('revealed') ||
    cell.classList.contains('flagged')
  ) {
    return;
  }
  if (grid[row][col] === 'mine') {
    cell.classList.add('mine', 'revealed');
    cell.textContent = String.fromCodePoint(0x1f4a3);
    gameOver(false);
    return;
  }

  const value = grid[row][col] as number;
  cell.classList.add('revealed');
  cell.dataset.val = String(value);
  cell.textContent = value === 0 ? '' : String(value);
  if (value === 0) {
    for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
      for (let colOffset = -1; colOffset <= 1; colOffset++) {
        revealCell(row + rowOffset, col + colOffset);
      }
    }
  }
  checkWin();
}

function gameOver(win: boolean): void {
  isGameOver = true;
  stopTimer();
  resetButton.textContent = win
    ? String.fromCodePoint(0x1f60e)
    : String.fromCodePoint(0x1f92f);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row][col] !== 'mine') continue;
      const cell = document.querySelector<HTMLDivElement>(
        `[data-row="${row}"][data-col="${col}"]`,
      );
      if (cell && !cell.classList.contains('flagged')) {
        cell.classList.add('mine', 'revealed');
        cell.textContent = String.fromCodePoint(0x1f4a3);
      }
    }
  }
  modalMessage.textContent = win
    ? '恭喜，你赢了！'
    : '哎呀，你输了，再接再厉！';
  window.setTimeout(() => {
    modal.style.display = 'flex';
  }, 500);
}

function checkWin(): void {
  if (
    document.querySelectorAll('.cell.revealed').length ===
    rows * cols - mines
  ) {
    gameOver(true);
  }
}

function resetGame(): void {
  isGameOver = false;
  stopTimer();
  seconds = 0;
  firstClick = true;
  timerElement.textContent = '0';
  resetButton.textContent = String.fromCodePoint(0x1f642);
  minesLeft = mines;
  minesLeftElement.textContent = String(minesLeft);
  createGrid();
  renderGrid();
  modal.style.display = 'none';
}

function startTimer(): void {
  stopTimer();
  timerInterval = window.setInterval(() => {
    seconds++;
    timerElement.textContent = String(seconds);
  }, 1000);
}

function stopTimer(): void {
  if (timerInterval === null) return;
  window.clearInterval(timerInterval);
  timerInterval = null;
}

resetButton.addEventListener('click', resetGame);
restartButton.addEventListener('click', resetGame);

difficultyButtons.forEach((button) => {
  button.addEventListener('click', () => {
    switch (button.dataset.difficulty) {
      case 'easy':
        rows = 9;
        cols = 9;
        mines = 10;
        break;
      case 'medium':
        rows = 16;
        cols = 16;
        mines = 40;
        break;
      case 'hard':
        rows = 16;
        cols = 30;
        mines = 99;
        break;
    }
    resetGame();
  });
});

customButton.addEventListener('click', () => {
  const customRows = Number(
    (document.getElementById('custom-rows') as HTMLInputElement).value,
  );
  const customCols = Number(
    (document.getElementById('custom-cols') as HTMLInputElement).value,
  );
  const customMines = Number(
    (document.getElementById('custom-mines') as HTMLInputElement).value,
  );
  if (
    Number.isInteger(customRows) &&
    Number.isInteger(customCols) &&
    Number.isInteger(customMines) &&
    customRows >= 5 &&
    customRows <= 30 &&
    customCols >= 5 &&
    customCols <= 30 &&
    customMines >= 1 &&
    customMines < customRows * customCols
  ) {
    rows = customRows;
    cols = customCols;
    mines = customMines;
    resetGame();
  } else {
    window.alert('设置无效（行/列范围 5-30）');
  }
});

resetGame();

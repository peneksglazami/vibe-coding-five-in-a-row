import React, { useState, useEffect } from 'react';
import './App.css';
// @ts-ignore
import html2canvas from 'html2canvas';
import Commentator from './components/Commentator';
import Fireworks from './components/Fireworks';

type CellValue = 'X' | 'O' | null;
type Difficulty = 'easy' | 'normal' | 'hard';

function App() {
  const [boardSize, setBoardSize] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [board, setBoard] = useState<CellValue[][]>(
    Array(boardSize).fill(null).map(() => Array(boardSize).fill(null))
  );
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [winner, setWinner] = useState<CellValue | 'draw' | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [bestMove, setBestMove] = useState<{row: number, col: number} | null>(null);
  const [lastMove, setLastMove] = useState<{row: number, col: number, player: CellValue, gameOver: boolean} | null>(null);
  const [probabilities, setProbabilities] = useState<{x: number, o: number}>({x: 50, o: 50});
  const [winningCells, setWinningCells] = useState<{row: number, col: number}[]>([]);

  const handleBoardSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(event.target.value);
    setBoardSize(newSize);
    resetGame(newSize);
  };

  const resetGame = (size: number = boardSize) => {
    setBoard(Array(size).fill(null).map(() => Array(size).fill(null)));
    setIsXNext(true);
    setGameOver(false);
    setShowModal(false);
    setWinner(null);
    setWinningCells([]);
  };

  const checkWin = (board: CellValue[][], currentValue: CellValue): boolean => {
    const winningLine: {row: number, col: number}[] = [];
    
    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        if (board[row][col] === currentValue) {
          // Проверяем горизонтальную линию
          if (col + 4 < boardSize &&
              board[row][col + 1] === currentValue &&
              board[row][col + 2] === currentValue &&
              board[row][col + 3] === currentValue &&
              board[row][col + 4] === currentValue) {
            winningLine.push(
              {row, col},
              {row, col: col + 1},
              {row, col: col + 2},
              {row, col: col + 3},
              {row, col: col + 4}
            );
            setWinningCells(winningLine);
            return true;
          }

          // Проверяем вертикальную линию
          if (row + 4 < boardSize &&
              board[row + 1][col] === currentValue &&
              board[row + 2][col] === currentValue &&
              board[row + 3][col] === currentValue &&
              board[row + 4][col] === currentValue) {
            winningLine.push(
              {row, col},
              {row: row + 1, col},
              {row: row + 2, col},
              {row: row + 3, col},
              {row: row + 4, col}
            );
            setWinningCells(winningLine);
            return true;
          }

          // Проверяем диагональную линию (сверху вниз)
          if (row + 4 < boardSize && col + 4 < boardSize &&
              board[row + 1][col + 1] === currentValue &&
              board[row + 2][col + 2] === currentValue &&
              board[row + 3][col + 3] === currentValue &&
              board[row + 4][col + 4] === currentValue) {
            winningLine.push(
              {row, col},
              {row: row + 1, col: col + 1},
              {row: row + 2, col: col + 2},
              {row: row + 3, col: col + 3},
              {row: row + 4, col: col + 4}
            );
            setWinningCells(winningLine);
            return true;
          }

          // Проверяем диагональную линию (снизу вверх)
          if (row + 4 < boardSize && col - 4 >= 0 &&
              board[row + 1][col - 1] === currentValue &&
              board[row + 2][col - 2] === currentValue &&
              board[row + 3][col - 3] === currentValue &&
              board[row + 4][col - 4] === currentValue) {
            winningLine.push(
              {row, col},
              {row: row + 1, col: col - 1},
              {row: row + 2, col: col - 2},
              {row: row + 3, col: col - 3},
              {row: row + 4, col: col - 4}
            );
            setWinningCells(winningLine);
            return true;
          }
        }
      }
    }
    return false;
  };

  const findBestMove = () => {
    const emptyCells = [];
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        if (!board[i][j]) {
          const score = evaluateMove(board, i, j, 'O');
          emptyCells.push({ row: i, col: j, score });
        }
      }
    }

    // Сортируем ходы по оценке (от лучшего к худшему)
    emptyCells.sort((a, b) => b.score - a.score);

    // Выбираем ход в зависимости от уровня сложности
    let selectedMove;
    const random = Math.random();

    if (difficulty === 'hard') {
      // Всегда выбираем лучший ход
      selectedMove = emptyCells[0];
    } else if (difficulty === 'normal') {
      // В 20% случаев выбираем неоптимальный ход
      if (random < 0.2 && emptyCells.length > 5) {
        // Выбираем из 3-7 лучших ходов
        const randomIndex = Math.floor(Math.random() * 3) + 3;
        selectedMove = emptyCells[randomIndex];
      } else {
        selectedMove = emptyCells[0];
      }
    } else { // easy
      // В 35% случаев выбираем неоптимальный ход
      if (random < 0.35 && emptyCells.length > 5) {
        // Выбираем из 4-8 лучших ходов
        const randomIndex = Math.floor(Math.random() * 4) + 4;
        selectedMove = emptyCells[randomIndex];
      } else {
        selectedMove = emptyCells[0];
      }
    }

    return selectedMove;
  };

  const findHintMove = () => {
    const emptyCells = [];
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        if (!board[i][j]) {
          const score = evaluateMove(board, i, j, 'O');
          emptyCells.push({ row: i, col: j, score });
        }
      }
    }
    // Сортируем ходы по оценке и возвращаем лучший
    emptyCells.sort((a, b) => b.score - a.score);
    return emptyCells[0];
  };

  const evaluateMove = (board: CellValue[][], row: number, col: number, playerSymbol: CellValue): number => {
    let score = 0;
    const directions = [
      [1, 0],   // горизонталь
      [0, 1],   // вертикаль
      [1, 1],   // диагональ вправо-вниз
      [1, -1]   // диагональ вправо-вверх
    ];

    // Оценка для хода компьютера
    for (const [dx, dy] of directions) {
      score += evaluateDirection(board, row, col, dx, dy, playerSymbol);
    }

    // Оценка для хода игрока (защита)
    for (const [dx, dy] of directions) {
      score += evaluateDirection(board, row, col, dx, dy, playerSymbol === 'X' ? 'O' : 'X') * 
        (difficulty === 'hard' ? 1.2 : difficulty === 'normal' ? 1.0 : 0.9);
    }

    // Дополнительные бонусы для режимов "Сложно" и "Нормально"
    if (difficulty === 'hard' || difficulty === 'normal') {
      // Бонус за центральные клетки
      const center = Math.floor(boardSize / 2);
      const distanceFromCenter = Math.abs(row - center) + Math.abs(col - center);
      score += (boardSize - distanceFromCenter) * (difficulty === 'hard' ? 2 : 1);

      // Бонус за блокировку потенциальных линий игрока
      for (const [dx, dy] of directions) {
        if (isBlockingMove(board, row, col, dx, dy, playerSymbol === 'X' ? 'O' : 'X')) {
          score += difficulty === 'hard' ? 50 : 30;
        }
      }
    } else if (difficulty === 'easy') {
      // Небольшой бонус за центральные клетки в режиме "Легко"
      const center = Math.floor(boardSize / 2);
      const distanceFromCenter = Math.abs(row - center) + Math.abs(col - center);
      score += (boardSize - distanceFromCenter) * 0.5;
    }

    return score;
  };

  const isBlockingMove = (board: CellValue[][], row: number, col: number, dx: number, dy: number, playerSymbol: CellValue): boolean => {
    let count = 0;
    let blocked = false;
    
    // Проверяем в обе стороны от текущей позиции
    for (let i = -4; i <= 4; i++) {
      const newRow = row + dx * i;
      const newCol = col + dy * i;
      
      if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize) {
        if (board[newRow][newCol] === playerSymbol) {
          count++;
          if (count >= 3) {
            blocked = true;
            break;
          }
        } else if (board[newRow][newCol] !== null) {
          count = 0;
        }
      }
    }
    
    return blocked;
  };

  const evaluateDirection = (board: CellValue[][], row: number, col: number, dx: number, dy: number, playerSymbol: CellValue): number => {
    let score = 0;
    let count = 0;
    let openEnds = 0;
    let tempRow = row;
    let tempCol = col;

    // Проверяем в обе стороны от текущей позиции
    for (let i = -4; i <= 4; i++) {
      tempRow = row + dx * i;
      tempCol = col + dy * i;

      if (tempRow >= 0 && tempRow < boardSize && tempCol >= 0 && tempCol < boardSize) {
        if (board[tempRow][tempCol] === playerSymbol) {
          count++;
        } else if (board[tempRow][tempCol] === null) {
          openEnds++;
          if (i === -4 || i === 4) {
            score += openEnds * (difficulty === 'hard' ? 10 : difficulty === 'normal' ? 8 : 6);
          }
        } else {
          count = 0;
          openEnds = 0;
        }

        // Оценка для разных уровней сложности
        if (difficulty === 'hard') {
          if (count === 4 && openEnds > 0) score += 1000;
          if (count === 3 && openEnds > 1) score += 500;
          if (count === 2 && openEnds > 2) score += 100;
        } else if (difficulty === 'normal') {
          if (count === 4 && openEnds > 0) score += 800;
          if (count === 3 && openEnds > 1) score += 400;
          if (count === 2 && openEnds > 2) score += 80;
        } else {
          if (count === 4 && openEnds > 0) score += 600;
          if (count === 3 && openEnds > 1) score += 300;
          if (count === 2 && openEnds > 2) score += 60;
        }
      }
    }

    return score;
  };

  const handleClick = (row: number, col: number) => {
    if (board[row][col] !== null || gameOver) return;

    const newBoard = board.map(row => [...row]);
    newBoard[row][col] = 'X';
    setBoard(newBoard);
    setIsXNext(false);
    setLastMove({
      row, 
      col, 
      player: 'X',
      gameOver: checkWin(newBoard, 'X') || checkDraw(newBoard)
    });

    if (checkWin(newBoard, 'X')) {
      setWinner('X');
      setGameOver(true);
      setShowModal(true);
      return;
    }

    if (checkDraw(newBoard)) {
      setWinner('draw');
      setGameOver(true);
      setShowModal(true);
      return;
    }
  };

  useEffect(() => {
    if (!isXNext && !gameOver) {
      const timer = setTimeout(() => {
        computerMove();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isXNext, gameOver]);

  useEffect(() => {
    if (showHint && isXNext && !gameOver) {
      const move = findHintMove();
      setBestMove(move);
    } else {
      setBestMove(null);
    }
  }, [showHint, isXNext, gameOver, board]);

  const computerMove = () => {
    const bestMove = findBestMove();
    const newBoard = board.map(row => [...row]);
    newBoard[bestMove.row][bestMove.col] = 'O';
    setLastMove({
      row: bestMove.row, 
      col: bestMove.col, 
      player: 'O',
      gameOver: checkWin(newBoard, 'O') || checkDraw(newBoard)
    });

    setBoard(newBoard);
    setIsXNext(true);

    setTimeout(() => {
      if (checkWin(newBoard, 'O')) {
        setWinner('O');
        setGameOver(true);
        setShowModal(true);
      } else if (checkDraw(newBoard)) {
        setWinner('draw');
        setGameOver(true);
        setShowModal(true);
      }
    }, 100);
  };

  const checkDraw = (board: CellValue[][]) => {
    return board.every(row => row.every(cell => cell !== null));
  };

  const downloadBoardImage = async () => {
    const boardElement = document.querySelector('.board') as HTMLElement;
    if (!boardElement) return;
    const canvas = await html2canvas(boardElement);
    const link = document.createElement('a');
    link.download = 'five-in-a-row-board.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="App">
      <h1>Пять в ряд</h1>
      <div className="game-container">
        <div className="game-board">
          <div className="board">
            {board.map((row, rowIndex) => (
              <div key={rowIndex} className="board-row">
                {row.map((cell, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`cell ${
                      bestMove && bestMove.row === rowIndex && bestMove.col === colIndex ? 'hint-cell' : ''
                    } ${
                      winningCells.some(cell => cell.row === rowIndex && cell.col === colIndex) ? 'winning-cell' : ''
                    }`}
                    data-value={cell}
                    onClick={() => handleClick(rowIndex, colIndex)}
                  >
                    {cell}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="status">
            {gameOver ? 'Игра окончена' : `Следующий ход: ${isXNext ? 'Игрок (X)' : 'Компьютер (O)'}`}
          </div>
        </div>
        <div className="game-controls">
          <div className="hint-control">
            <label>
              <input
                type="checkbox"
                checked={showHint}
                onChange={(e) => setShowHint(e.target.checked)}
              />
              Показывать подсказку
            </label>
          </div>
          <div className="board-size-control">
            <label>
              Размер поля:
              <select 
                value={boardSize} 
                onChange={handleBoardSizeChange}
                className="board-size-select"
              >
                <option value={10}>10 x 10</option>
                <option value={15}>15 x 15</option>
                <option value={20}>20 x 20</option>
              </select>
            </label>
          </div>
          <div className="difficulty-selector">
            <label htmlFor="difficulty">Уровень сложности:</label>
            <select 
              id="difficulty" 
              value={difficulty} 
              onChange={(e) => {
                setDifficulty(e.target.value as Difficulty);
                resetGame();
              }}
            >
              <option value="easy">Легко</option>
              <option value="normal">Нормально</option>
              <option value="hard">Сложно</option>
            </select>
          </div>
        </div>
      </div>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>
              {winner === 'X' ? 'Вы победили!' : 
               winner === 'O' ? 'Компьютер победил!' : 
               'Ничья!'}
            </h2>
            <div className="modal-buttons">
              <button className="modal-button new-game" onClick={() => resetGame()}>
                Начать новую игру
              </button>
              <button className="modal-button" onClick={downloadBoardImage}>
                <svg 
                  className="download-icon" 
                  viewBox="0 0 24 24" 
                  width="16" 
                  height="16" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Скачать картинку игрового поля
              </button>
            </div>
          </div>
        </div>
      )}
      <Commentator lastMove={lastMove} />
      <Fireworks isActive={winner === 'X' && gameOver} />
    </div>
  );
}

export default App; 
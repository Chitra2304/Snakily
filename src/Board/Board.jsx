import React, { useEffect, useState } from "react";
import {
  randomIntFromInterval,
  reverseLinkedList,
  useInterval,
} from "../lib/utils.js";

import "./Board.css";

class LinkedListNode {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

class LinkedList {
  constructor(value) {
    const node = new LinkedListNode(value);
    this.head = node;
    this.tail = node;
  }
}

const Direction = {
  UP: "UP",
  RIGHT: "RIGHT",
  DOWN: "DOWN",
  LEFT: "LEFT",
};

const BOARD_ROW = 10;
const BOARD_COL = 20;
const PROBABILITY_OF_DIRECTION_REVERSAL_FOOD = 0.0;

const getStartingSnakeLLValue = (board) => {
  const rowSize = board.length;
  const colSize = board[0].length;
  const startingRow = Math.round(rowSize / 3);
  const startingCol = Math.round(colSize / 3);
  const startingCell = board[startingRow][startingCol];
  return {
    row: startingRow,
    col: startingCol,
    cell: startingCell,
  };
};

const Board = () => {
  const [score, setScore] = useState(0);
  const [board, setBoard] = useState(createBoard(BOARD_ROW, BOARD_COL));
  const [snake, setSnake] = useState(
    new LinkedList(getStartingSnakeLLValue(board))
  );
  const [snakeCells, setSnakeCells] = useState(
    new Set([snake.head.value.cell])
  );
  // Naively set the starting food cell 5 cells away from the starting snake cell.
  const [foodCell, setFoodCell] = useState(snake.head.value.cell + 5);
  const [direction, setDirection] = useState(Direction.RIGHT);
  const [foodShouldReverseDirection, setFoodShouldReverseDirection] =
    useState(false);

  useEffect(() => {
    window.addEventListener("keydown", (e) => {
      handleKeydown(e);
    });
  }, []);

  // `useInterval` is needed; you can't naively do `setInterval` in the
  // `useEffect` above. See the article linked above the `useInterval`
  // definition for details.
  useInterval(() => {
    moveSnake();
  }, 150);

  const handleKeydown = (e) => {
    // const newDirection = getDirectionFromKey(e.key);
    // const isValidDirection = newDirection !== "";
    // if (!isValidDirection) return;
    // const snakeWillRunIntoItself =
    //   getOppositeDirection(newDirection) === direction && snakeCells.size > 1;
    // // Note: this functionality is currently broken, for the same reason that
    // // `useInterval` is needed. Specifically, the `direction` and `snakeCells`
    // // will currently never reflect their "latest version" when `handleKeydown`
    // // is called. I leave it as an exercise to the viewer to fix this :P
    // if (snakeWillRunIntoItself) return;
    // setDirection(newDirection);
  };

  const moveSnake = () => {
    const currentHeadCoords = {
      row: snake.head.value.row,
      col: snake.head.value.col,
    };
    const tempDirection = getRandomDirection(direction);
    setDirection(tempDirection);
    const nextHeadCoords = getCoordsInDirection(
      currentHeadCoords,
      tempDirection
    );
    if (isOutOfBounds(nextHeadCoords, board)) {
      handleDirectionChange(nextHeadCoords, board);
      return;
    }
    const nextHeadCell = board[nextHeadCoords.row][nextHeadCoords.col];
    if (snakeCells.has(nextHeadCell)) {
      reverseSnake();
      return;
    }

    const newHead = new LinkedListNode({
      row: nextHeadCoords.row,
      col: nextHeadCoords.col,
      cell: nextHeadCell,
    });
    const currentHead = snake.head;
    snake.head = newHead;
    currentHead.next = newHead;

    const newSnakeCells = new Set(snakeCells);
    newSnakeCells.delete(snake.tail.value.cell);
    newSnakeCells.add(nextHeadCell);

    snake.tail = snake.tail.next;
    if (snake.tail === null) snake.tail = snake.head;

    // const foodConsumed = nextHeadCell === foodCell;
    // if (foodConsumed) {
    //   // This function mutates newSnakeCells.
    //   growSnake(newSnakeCells);
    //   if (foodShouldReverseDirection) reverseSnake();
    //   handleFoodConsumption(newSnakeCells);
    // }

    setSnakeCells(newSnakeCells);
  };

  // This function mutates newSnakeCells.
  const growSnake = (newSnakeCells) => {
    const growthNodeCoords = getGrowthNodeCoords(snake.tail, direction);
    if (isOutOfBounds(growthNodeCoords, board)) {
      // Snake is positioned such that it can't grow; don't do anything.
      return;
    }
    const newTailCell = board[growthNodeCoords.row][growthNodeCoords.col];
    const newTail = new LinkedListNode({
      row: growthNodeCoords.row,
      col: growthNodeCoords.col,
      cell: newTailCell,
    });
    const currentTail = snake.tail;
    snake.tail = newTail;
    snake.tail.next = currentTail;

    newSnakeCells.add(newTailCell);
  };

  const reverseSnake = () => {
    const tailNextNodeDirection = getNextNodeDirection(snake.tail, direction);
    const newDirection = getOppositeDirection(tailNextNodeDirection);
    setDirection(newDirection);

    // The tail of the snake is really the head of the linked list, which
    // is why we have to pass the snake's tail to `reverseLinkedList`.
    reverseLinkedList(snake.tail);
    const snakeHead = snake.head;
    snake.head = snake.tail;
    snake.tail = snakeHead;
  };

  const handleFoodConsumption = (newSnakeCells) => {
    const maxPossibleCellValue = BOARD_ROW * BOARD_COL;
    let nextFoodCell;
    // In practice, this will never be a time-consuming operation. Even
    // in the extreme scenario where a snake is so big that it takes up 90%
    // of the board (nearly impossible), there would be a 10% chance of generating
    // a valid new food cell--so an average of 10 operations: trivial.
    while (true) {
      nextFoodCell = randomIntFromInterval(1, maxPossibleCellValue);
      if (newSnakeCells.has(nextFoodCell) || foodCell === nextFoodCell)
        continue;
      break;
    }

    const nextFoodShouldReverseDirection =
      Math.random() < PROBABILITY_OF_DIRECTION_REVERSAL_FOOD;

    setFoodCell(nextFoodCell);
    setFoodShouldReverseDirection(nextFoodShouldReverseDirection);
    setScore(score + 1);
  };

  const handleDirectionChange = (coords, board) => {
    const { row, col } = coords;
    // console.log(`Game over! Snake ran into (${row}, ${col})`);
    if (row < 0) {
      if (col === 0) {
        setDirection(Direction.RIGHT);
      } else if (col === board[0].length - 1) {
        setDirection(Direction.LEFT);
      } else {
        const randomDirection =
          Math.random() < 0.5 ? Direction.LEFT : Direction.RIGHT;
        setDirection(randomDirection);
      }
    } else if (row >= board.length) {
      if (col === 0) {
        setDirection(Direction.RIGHT);
      } else if (col === board[0].length - 1) {
        setDirection(Direction.LEFT);
      } else {
        const randomDirection =
          Math.random() < 0.5 ? Direction.LEFT : Direction.RIGHT;
        setDirection(randomDirection);
      }
    } else if (col < 0) {
      if (row === 0) {
        setDirection(Direction.DOWN);
      } else if (row === board.length - 1) {
        setDirection(Direction.UP);
      } else {
        const randomDirection =
          Math.random() < 0.5 ? Direction.UP : Direction.DOWN;
        setDirection(randomDirection);
      }
    } else if (col >= board[0].length) {
      if (row === 0) {
        setDirection(Direction.DOWN);
      } else if (row === board.length - 1) {
        setDirection(Direction.UP);
      } else {
        const randomDirection =
          Math.random() < 0.5 ? Direction.UP : Direction.DOWN;
        setDirection(randomDirection);
      }
    }
  };

  const handleSnakeCollision = () => {};

  return (
    <>
      <h1>Score: {score}</h1>
      <div className="board">
        {board.map((row, rowIdx) => (
          <div key={rowIdx} className="row">
            {row.map((cellValue, cellIdx) => {
              const className = getCellClassName(
                cellValue,
                foodCell,
                foodShouldReverseDirection,
                snakeCells
              );
              return <div key={cellIdx} className={className}></div>;
            })}
          </div>
        ))}
      </div>
    </>
  );
};

const createBoard = (BOARD_ROW, BOARD_COL) => {
  let counter = 1;
  const board = [];
  for (let row = 0; row < BOARD_ROW; row++) {
    const currentRow = [];
    for (let col = 0; col < BOARD_COL; col++) {
      currentRow.push(counter++);
    }
    board.push(currentRow);
  }
  return board;
};

const getRandomDirection = (currentDirection) => {
  const directions = Object.values(Direction);
  const oppositeDirection = getOppositeDirection(currentDirection);
  const validDirections = directions.filter((dir) => dir !== oppositeDirection);
  const changeDirection = Math.random() < 0.3;
  if (changeDirection) {
    const randomIndex = Math.floor(Math.random() * validDirections.length);
    return validDirections[randomIndex];
  }
  return currentDirection;
};

const getCoordsInDirection = (coords, direction) => {
  // const direction = getRandomDirection(currDirection);
  // setDirection(direction);

  if (direction === Direction.UP) {
    return {
      row: coords.row - 1,
      col: coords.col,
    };
  }
  if (direction === Direction.RIGHT) {
    return {
      row: coords.row,
      col: coords.col + 1,
    };
  }
  if (direction === Direction.DOWN) {
    return {
      row: coords.row + 1,
      col: coords.col,
    };
  }
  if (direction === Direction.LEFT) {
    return {
      row: coords.row,
      col: coords.col - 1,
    };
  }
};

const isOutOfBounds = (coords, board) => {
  const { row, col } = coords;
  if (row < 0 || col < 0) return true;
  if (row >= board.length || col >= board[0].length) return true;
  return false;
};

const getDirectionFromKey = (key) => {
  if (key === "ArrowUp") return Direction.UP;
  if (key === "ArrowRight") return Direction.RIGHT;
  if (key === "ArrowDown") return Direction.DOWN;
  if (key === "ArrowLeft") return Direction.LEFT;
  return "";
};

const getNextNodeDirection = (node, currentDirection) => {
  if (node.next === null) return currentDirection;
  const { row: currentRow, col: currentCol } = node.value;
  const { row: nextRow, col: nextCol } = node.next.value;
  if (nextRow === currentRow && nextCol === currentCol + 1) {
    return Direction.RIGHT;
  }
  if (nextRow === currentRow && nextCol === currentCol - 1) {
    return Direction.LEFT;
  }
  if (nextCol === currentCol && nextRow === currentRow + 1) {
    return Direction.DOWN;
  }
  if (nextCol === currentCol && nextRow === currentRow - 1) {
    return Direction.UP;
  }
  return "";
};

const getGrowthNodeCoords = (snakeTail, currentDirection) => {
  const tailNextNodeDirection = getNextNodeDirection(
    snakeTail,
    currentDirection
  );
  const growthDirection = getOppositeDirection(tailNextNodeDirection);
  const currentTailCoords = {
    row: snakeTail.value.row,
    col: snakeTail.value.col,
  };
  const growthNodeCoords = getCoordsInDirection(
    currentTailCoords,
    growthDirection
  );
  return growthNodeCoords;
};

const getOppositeDirection = (direction) => {
  if (direction === Direction.UP) return Direction.DOWN;
  if (direction === Direction.RIGHT) return Direction.LEFT;
  if (direction === Direction.DOWN) return Direction.UP;
  if (direction === Direction.LEFT) return Direction.RIGHT;
};

const getCellClassName = (
  cellValue,
  foodCell,
  foodShouldReverseDirection,
  snakeCells
) => {
  let className = "cell";
  if (cellValue === foodCell) {
    if (foodShouldReverseDirection) {
      className = "cell cell-purple";
    } else {
      className = "cell cell-red";
    }
  }
  if (snakeCells.has(cellValue)) className = "cell cell-green";

  return className;
};

export default Board;

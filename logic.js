const Gameboard = (() => {
  let size = 3;

  let board = Array.from(Array(size), () => new Array(size))

  const restart = () => {
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        board[i][j] = null;
      }
    }
  }

  const _checkRow = (row, side) => {
    for (let i = 0; i < size; i++) {
      if (board[row][i] !== side) return 0;
    }
    return 1;
  };
  const _checkColumn = (column, side) => {
    for (let i = 0; i < size; i++) {
      if (board[i][column] !== side) return 0;
    }
    return 1;
  };
  const _checkMainDiagonal = (side) => {
    for (let i = 0; i < size; i++) {
      if (board[i][i] !== side) return 0;
    }
    return 1;
  };
  const _checkAntiDiagonal = (side) => {
    for (let i = 0; i < size; i++) {
      if (board[i][size - i - 1] !== side) return 0;
    }
    return 1;
  };
  const checkForAWin = (row, column, side) => {
    let f = _checkRow(row, side) || _checkColumn(column, side);
    if (row == column) {
      f |=  _checkMainDiagonal(side);
    }
    if (row == size - column - 1) {
      f |= _checkAntiDiagonal(side);
    }
    return f;
  };
  const getOpponent = (side) => (side == 'X' ? 'O' : 'X');

  const minimax = (row, column, depth, side, max) => {

    let result = checkForAWin(row, column, getOpponent(side));
    if (depth == 10 || result) {
      return (side == max ? -result : result);
    }

    if (side == max) {
      var best = -Infinity;
    } else {
      var best = Infinity;
    }

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (!board[i][j]) {
          board[i][j] = side;
          let score = minimax(i, j, depth + 1, getOpponent(side), max);
          if (side == max) {
            best = Math.max(score, best);
          } else {
            best = Math.min(score, best);
          }
          board[i][j] = null;
        }
      }
    }
    return best;
  };

  const makeBestChoice = (side, depth) => {
    let best = -Infinity;
    let move = { i: -1, j: -1 };
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (!board[i][j]) {
          board[i][j] = side;
          let score = minimax(i, j, depth + 1, getOpponent(side), side);
          board[i][j] = null;
          if (score >= best) {
            best = score;
            move = { i, j };
          }
        }
      }
    }
    board[move.i][move.j] = side;
    displayController.modifyGivenCell(move.i, move.j, side);
    return checkForAWin(move.i, move.j, side);
  };

  const fillCell = (row, column, side) => {
    board[row][column] = side;
  };

  return { fillCell, restart, checkForAWin, makeBestChoice, getOpponent };
})();

const Game = (() => {
  let curRound = 1;
  let firstPlayerSide = 'X';
  let secondPlayerSide = 'O';
  const getRound = () => curRound;
  const getState = () => (curRound % 2 ? firstPlayerSide : secondPlayerSide);

  const switchSides = () => {
    [firstPlayerSide, secondPlayerSide] = [secondPlayerSide, firstPlayerSide];
  };

  const play = (row, column) => {
    let side = getState();
    let opponent = Gameboard.getOpponent(side);
    Gameboard.fillCell(row, column, side);
    curRound++;
    if (Gameboard.checkForAWin(row, column, side)) {
      return `${side} won!`;
    }
    if (curRound >= 10) {
      return "It's a draw!";
    }
    if (Gameboard.makeBestChoice(opponent, curRound)) {
      return `${opponent} won!`;
    }
    curRound++;
    return null;
  };

  const restart = () => {
    curRound = 1;
    Gameboard.restart();
  };

  return { play, restart, getState, getRound, switchSides };
})();

const displayController = (() => {
  let size = 3;

  let cell = Array.from(Array(size), () => new Array(size))
  let row = Array(size);

  const overlay = document.querySelector('.overlay');
  const overlayText = document.querySelector('.overlay-text');

  const modifyGivenCell = (row, column, side) => {
    var img = document.createElement('img');
    if (side === 'O') {
      img.src = 'naught.svg';
    } else {
      img.src = 'cross.svg';
    }
    cell[row][column].appendChild(img);
  };

  function modifyCell(e) {
    if (!this.firstChild) {
      let row = this.getAttribute('data-row');
      let column = this.getAttribute('data-column');

      modifyGivenCell(row, column, Game.getState());

      let result = Game.play(row, column);
      if (result) {
        overlayText.textContent = result;
        overlay.classList.add('active');
        overlay.classList.add('smooth');
      }
    }
  };

  const _init = (() => {
    const gameboardDisplay = document.querySelector('.gameboard');
    for (let i = 0; i < size; i++) {
      row[i] = document.createElement('div');
      row[i].classList.add('gameboard-row');
      for (let j = 0; j < size; j++) {
        cell[i][j] = document.createElement('button');
        cell[i][j].classList.add('cell');
        cell[i][j].setAttribute('data-row', i);
        cell[i][j].setAttribute('data-column', j);
        cell[i][j].addEventListener('click', modifyCell);
        row[i].appendChild(cell[i][j]);
      }
      gameboardDisplay.appendChild(row[i]);
    }
  })();

  const _clean = () => {
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        cell[i][j].textContent = '';
      }
    }
  };

  const _restart = (() => {
    overlay.addEventListener('click', () => {
      overlay.classList.remove('active');
      _clean();
      Game.restart();
    });
    overlay.addEventListener('dblclick', () => {
      overlay.classList.remove('smooth');
      overlay.classList.remove('active');
      _clean();
      Game.restart();
    });
  })();

  const _newSide = (() => {
    const btns = Array.from(document.querySelectorAll('.btn'));
    btns.forEach(btn => btn.addEventListener('click', function (e) {
      if (!this.classList.contains('active')) {
        btns.forEach(btn => btn.classList.toggle('active'));
        Game.switchSides();
      }
    }));
  })();
  return { modifyGivenCell };
})();

const Player = (name, side) => {
  const getSide = () => side;
  const getName = () => name;
  const getChoice = () => {
    console.log(`It's your turn, ${name}`);
  }
}

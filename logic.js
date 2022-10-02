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
    let moves = { i: -1, j: -1 };
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (!board[i][j]) {
          board[i][j] = side;
          let score = minimax(i, j, depth + 1, getOpponent(side), side);
          if (checkForAWin(i, j, side)) {
            score = Infinity;
          }
          board[i][j] = null;
          if (score > best) {
            best = score;
            moves = [ { i, j } ];
          } else if (score == best) {
            best = score
            moves.push({ i, j });
          }
        }
      }
    }
    let rndIndex = Math.floor(Math.random() * moves.length);
    let move = moves[rndIndex];
    board[move.i][move.j] = side;
    displayController.modifyGivenCell(move.i, move.j, side);
    return checkForAWin(move.i, move.j, side);
  };

  const fillCell = (row, column, side) => {
    board[row][column] = side;
  };

  return { fillCell, restart, checkForAWin, makeBestChoice, getOpponent };
})();

const Player = (side, isAI) => {
  let _side = side;
  let opponent = (side == 'X' ? 'O' : 'X');
  function changeSide() {
    [this.side, this.opponent] = [this.opponent, this.side];
  };
  function toggleAI() {
    this.isAI ^= 1;
  };
  return { side, opponent, isAI, changeSide, toggleAI }
}

const Game = (() => {
  let curRound = 1;
  const players = [
    Player('X', 0),
    Player('O', 1)
  ];
  const getState = () => players[(curRound + 1) % 2].side;
  const isAIvsAI = () => (players[0].isAI & players[1].isAI == 1);
  const isAIplaying = () => (players[0].isAI | players[1].isAI == 1);

  const switchSides = () => {
    players[0].changeSide();
    players[1].changeSide();
    restart();
  };

  const switchMode = (playerIndex) => {
    players[playerIndex].toggleAI();
    restart();
  };

  const makeAIMove = () => {
    let side = getState();
    if (Gameboard.makeBestChoice(side, curRound)) {
      return `${side} won!`;
    }
    curRound++;
    if (curRound >= 10) {
      return "It's a draw!";
    }
    return null;
  };

  const registerPlayerMove = (row, column) => {
    let side = getState();
    Gameboard.fillCell(row, column, side);
    if (Gameboard.checkForAWin(row, column, side)) {
      return `${side} won!`;
    }
    curRound++;
    if (curRound >= 10) {
      return "It's a draw!";
    }
    if (isAIplaying()) {
      return makeAIMove();
    }
    return null;
  };

  const simulateAIvsAI = () => {
    while (curRound < 10) {
      if (Gameboard.makeBestChoice(getState(), curRound)) {
        return `${getState()} won!`;
      }
      curRound++;
    }
    return "It's a draw!";
  };

  const restart = () => {
    curRound = 1;
    displayController.restart();
    Gameboard.restart();
    if (isAIvsAI()) {
      simulateAIvsAI();
    } else if (players[0].isAI) {
      Gameboard.makeBestChoice(getState(), curRound);
      curRound++;
    }
  };

  return { registerPlayerMove, restart, getState, switchSides, switchMode };
})();

const displayController = (() => {
  let size = 3;

  let cell = Array.from(Array(size), () => new Array(size))
  let row = Array(size);

  const overlay = document.querySelector('.overlay');
  const overlayText = document.querySelector('.overlay-text');
  const reset = document.querySelector('.reset');

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

      let result = Game.registerPlayerMove(row, column);
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

  const restart = () => {
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        cell[i][j].textContent = '';
      }
    }
  };

  const _restartControls = (() => {
    overlay.addEventListener('click', () => {
      overlay.classList.remove('active');
      Game.restart();
    });
    overlay.addEventListener('dblclick', () => {
      overlay.classList.remove('smooth');
      overlay.classList.remove('active');
      Game.restart();
    });
    reset.addEventListener('click', () => {
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

  const _getMode = (() => {
    const AIbtns = Array.from(document.querySelectorAll('.AI'));
    AIbtns.forEach(btn => btn.addEventListener('click', function (e) {
      this.classList.toggle('active');
      const playerNumber = this.getAttribute('data-num');
      Game.switchMode(playerNumber);
    }));
  })();
  return { modifyGivenCell, restart };
})();

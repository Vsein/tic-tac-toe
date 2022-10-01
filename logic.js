const Gameboard = (() => {
  let size = 3;

  let state = Array.from(Array(size), () => new Array(size))

  const restart = () => {
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        state[i][j] = null;
      }
    }
  }

  const _checkRow = (row, side) => {
    for (let i = 0; i < size; i++) {
      if (state[row][i] !== side) return 0;
    }
    return 1;
  };
  const _checkColumn = (column, side) => {
    for (let i = 0; i < size; i++) {
      if (state[i][column] !== side) return 0;
    }
    return 1;
  };
  const _checkMainDiagonal = (side) => {
    for (let i = 0; i < size; i++) {
      if (state[i][i] !== side) return 0;
    }
    return 1;
  };
  const _checkAntiDiagonal = (side) => {
    for (let i = 0; i < size; i++) {
      if (state[i][size - i - 1] !== side) return 0;
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

  const fillCell = (row, column, side) => {
    state[row][column] = side;
  };

  return { fillCell, restart, checkForAWin };
})();

const Game = (() => {
  let curRound = 1;
  const getState = () => (curRound % 2 ? 'X' : 'O');

  const play = (row, column) => {
    let side = getState();
    Gameboard.fillCell(row, column, side);
    curRound++;
    if (Gameboard.checkForAWin(row, column, side)) {
      return `${side} won!`;
    }
    if (curRound === 10) {
      return "It's a draw!";
    }
    return null;
  };

  const restart = () => {
    curRound = 1;
    Gameboard.restart();
  };

  return { play, restart, getState };
})();

const displayController = (() => {
  let size = 3;

  let cell = Array.from(Array(size), () => new Array(size))
  let row = Array(size);

  const overlay = document.querySelector('.overlay');
  const overlayText = document.querySelector('.overlay-text');

  function modifyCell(e) {
    if (!this.firstChild) {
      let row = this.getAttribute('data-row');
      let column = this.getAttribute('data-column');

      var img = document.createElement('img');
      if (Game.getState() === 'O') {
        img.src = 'naught.svg';
      } else {
        img.src = 'cross.svg';
      }
      this.appendChild(img);

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
})();

const Player = (name, side) => {
  const getSide = () => side;
  const getName = () => name;
  const getChoice = () => {
    console.log(`It's your turn, ${name}`);
  }
}

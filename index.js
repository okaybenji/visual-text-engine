let disk = unlimitedAdventure;
const $ = (query) => document.querySelector(query);
const toArray = (nodeList) => [].slice.call(nodeList);

const buildRoomList = () => {
  const roomList = $('.start');
  while (roomList.firstChild) {
    roomList.removeChild(roomList.firstChild);
  }

  const options = disk.rooms.map(room => {
    const option = document.createElement('option');
    option.text = room.id;
    option.value = room.id;

    return option;
  });

  options.forEach(option => {
    roomList.appendChild(option);
  });
  roomList.value = disk.roomId;
};

const loadDisk = () => {
  // Load room list for initial game state
  buildRoomList();

  // Load initial inventory
  $('.inventory').innerText = (disk.inventory || [])
    .map(item => item.name)
    .join(', ');

  // Remove existing room cards
  const oldRoomCards = toArray(document.querySelectorAll('.room'));
  oldRoomCards.forEach(room => {
    $('body').removeChild(room)
  });

  // Add room cards
  const newRoomCards = disk.rooms.map(makeRoomCard);
  newRoomCards.forEach((r, i) => {
    $('body').appendChild(r);

    // Lay out cards in a cascade.
    r.style.top = `${(i % 16) * 5}vh`;
    r.style.left = `${(i % 16) * 5}vh`;
  });

  // Visualize connections between cards
  updateConnections(newRoomCards);
};

const importJSON = () => {
  const file = $('input').files[0];
  const fileReader = new FileReader();

  fileReader.onload = (e) => {
    disk = JSON.parse(e.target.result);
    loadDisk();
  };

  fileReader.readAsText(file);
};

const exportJSON = (json = disk) => {
  const filename = prompt('Save file as...', 'gameDisk.json');

  if (!filename) {
    return;
  }

  /**
   * Simply using JSON.stringify on a disk would remove all methods. To preserve the use methods on
   * items, we'll first create a disk object where use methods are replaced with use.toString().
   */
  const jsonWithFtnStrs = Object.create(json);
  jsonWithFtnStrs.roomId = jsonWithFtnStrs.roomId;

  const stringifyItemUse = (item) => {
    if (item.use) {
      item.use = item.use.toString();
    }

    return item;
  };

  jsonWithFtnStrs.inventory = jsonWithFtnStrs.inventory.map(stringifyItemUse);
  jsonWithFtnStrs.rooms = jsonWithFtnStrs.rooms.map((room) => {
    if (room.items) {
      room.items = room.items.map(stringifyItemUse);
    }
    return room;
  });

  const jsonString = JSON.stringify(jsonWithFtnStrs, null, 2);
  const jsonBlob = new Blob([jsonString], {type: 'text/plain;charset=utf-8'});
  saveAs(jsonBlob, filename);
};

// zIndex is used to always bring the last-clicked room to the top
let zIndex = disk.rooms.length;

// Make DOM element draggable
const makeMoveable = (element) => {
  let offsetX, offsetY;

  // Move room to mouse position (maintaining mouse position relative to room)
  const move = e => {
    element.style.top = `${e.clientY - offsetY}px`;
    element.style.left = `${e.clientX - offsetX}px`;
    updateConnections();
  };

  element.addEventListener('mousedown', e => {
    // Bring the room to the top when clicked
    element.style.zIndex = zIndex++;

    // Capture mouse position relative to element
    offsetX = e.clientX - element.offsetLeft;
    offsetY = e.clientY - element.offsetTop;

    // Only move if clicking title bar
    if (offsetY > 30) {
      return;
    }

    $('body').addEventListener('mousemove', move);
  }, false);

  $('body').addEventListener('mouseup', (e) => {
    $('body').removeEventListener('mousemove', move);
  }, false);

  element.addEventListener('mouseup', (e) => {
    $('body').removeEventListener('mousemove', move);
  }, false);
};

makeMoveable($('#settings'));

const makeRoomCard = ({id, name, desc, items, exits, img}) => {
  const roomCard = document.createElement('div');

  const itemList = (items || [])
    .map(item => item.name)
    .join(', ');

  const exitList = (exits || [])
    .map(exit => makeExit(exit));

  roomCard.innerHTML = `
    <br>
    <span class="title">
      <span class="id" contenteditable="true">${id}</span> <sup class="deleteRoom">x</sup>
    </span>
    <br>
    <span>
      <span class="prop">NAME</span>
      <span class="value name" contenteditable="true">${name}</span>
      <br>
      <br>
      <span class="prop">DESCRIPTION</span>
      <span class="value desc" contenteditable="true">${desc}</span>
      <br>
      <br>
      <span class="prop">ITEMS</span>
      <span class="value items">${itemList}</span>
      <br>
      <br>
      <span class="prop">EXITS <sup class="addExit">+</sup></span>
      <br>
      <span class="value exits"></span>
      <br>
      <span class="prop">ARTWORK</span>
      <br>
      <span class="value img" contenteditable="true">${img || ''}</span><br><br>
    </span>
  `;
  roomCard.classList.add('card'); // Style rooms as cards
  roomCard.classList.add('room'); // Style rooms as room cards
  roomCard.classList.add('resizable'); // Make them resizable

  exitList.forEach(exit => {
    roomCard.querySelector('.exits').appendChild(exit);
  });

  makeMoveable(roomCard);

  // Delete room
  roomCard.querySelector('.deleteRoom').onclick = () => {
    deleteRoom(roomCard);
  };

  // Add exit
  roomCard.querySelector('.addExit').onclick = () => {
    addExit(roomCard.querySelector('.exits'));
  };

  return roomCard;
};

const addRoom = () => {
  const room = makeRoomCard({
    id: 'roomId',
    name: 'Room name',
    desc: 'Room description',
  });

  $('body').appendChild(room);

  updateData();
};

const deleteRoom = (roomCard) => {
  const roomId = roomCard.querySelector('.id').innerText;
  const deleteWasConfirmed = confirm(`Press OK to delete room: ${roomId}. You cannot undo thus change. (However, the change will not be saved until you export your game data.)`);

  if (!deleteWasConfirmed) {
    return;
  }

  $('body').removeChild(roomCard);

  updateData();
};

const makeExit = ({dir, id}) => {
  const exit = document.createElement('div');
  exit.classList.add('exit');

  const direction = document.createElement('span');
  direction.contentEditable = true;
  direction.classList.add('dir');
  direction.innerText = dir;

  const roomId = document.createElement('span');
  roomId.contentEditable = true;
  roomId.classList.add('id');
  roomId.innerText = id;

  const arrow = document.createElement('span');
  arrow.innerText = ' → ';

  const deleteButton = document.createElement('sup');
  deleteButton.innerText = ' x';
  deleteButton.onclick = () => {
    exit.parentNode.removeChild(exit);
    updateData();
  };

  exit.appendChild(direction);
  exit.appendChild(arrow);
  exit.appendChild(roomId);
  exit.appendChild(deleteButton);

  return exit;
};

const addExit = (exitList) => {
  const exit = makeExit({dir: 'directionName', id: 'roomId'});
  exitList.appendChild(exit);
};

const updateConnections = (roomCards) => {
  roomCards = roomCards || toArray(document.querySelectorAll('.room'));
  const oldConnections = toArray(document.querySelectorAll('line'));
  oldConnections.forEach(line => {
    $('svg').removeChild(line);
  });

  const newConnections = disk.rooms.map((room, index) => {
    return (room.exits || []).map((exit) => {
      return makeConnection(roomCards[index], exit.id);
    });
  });

  newConnections.forEach(room => {
    room
      .filter(line => line)
      .forEach(line => {
        $('svg').appendChild(line);
      });
  });
};

// TODO: WIP!
const makeConnection = (source, exitId) => {
  const roomCards = toArray(document.querySelectorAll('.room'));
  const destination = roomCards.find(c => {
    return c.querySelector('.id').innerText === exitId;
  });

  if (!destination) {
    return;
  }

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', source.offsetLeft + source.offsetWidth)
    line.setAttribute('y1', source.offsetTop + source.offsetHeight / 2)
    line.setAttribute('x2', destination.offsetLeft - 12)
    line.setAttribute('y2', destination.offsetTop + destination.offsetHeight / 2);
    line.setAttribute('stroke', 'black');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('marker-end', 'url(#triangle)');

  return line;
};

// Update disk data in memory to reflect what is displayed on screen
const updateData = (e) => {
  // TODO: If user changes name of starting room, update starting roomId to match
  disk.roomId = $('.start').value;

  const roomCards = toArray(document.querySelectorAll('.room'));

  disk.rooms = roomCards.map((roomCard, i) => {
    const roomData = disk.rooms[i];

    const getVal = (className) => {
      const element = roomCard.querySelector(className);
      if (element) {
        return element.innerText;
      }
    };

    const exits = toArray(roomCard.querySelectorAll('.exit'))
      .filter(exit => (exit.querySelector('.dir'))) // TODO: why this?
      .map(exit => ({
        dir: exit.querySelector('.dir').innerText,
        id: exit.querySelector('.id').innerText,
      }));

    return Object.assign(roomData || {}, {
      id: getVal('.id'),
      name: getVal('.name'),
      desc: getVal('.desc'),
      img: getVal('.img'),
      exits,
    });
  });

  updateConnections();
  buildRoomList();
};

loadDisk(); // Load initial disk

$('body').addEventListener('keyup', updateData);

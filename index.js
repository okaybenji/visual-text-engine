const disk = unlimitedAdventure;

console.log(disk); // Debugging

const $ = (query) => document.querySelector(query);

$('#export').onclick = () => {
  const diskName = prompt('Enter a name for your disk (must be a valid JavaScript variable name)', 'gameDisk');

  if (!diskName) {
    return;
  }

  // TODO: This will currently remove item use methods.
  // First, create disk object where use methods are replace with use.toString().
  // Pass this version to JSON.stringify when creating diskString.
  // Then, update text-engine to check if a use method is a string and eval it.
  const diskString = `const ${diskName} = ${JSON.stringify(disk, null, 2)};`;
  const diskBlob = new Blob([diskString], {type: 'text/plain;charset=utf-8'});
  saveAs(diskBlob, `${diskName}.js`);
};

// zIndex is used to always bring the last-clicked room to the top
let zIndex = disk.rooms.length;

const deleteRoom = (roomCard) => {
  const roomId = roomCard.querySelector('.id').innerText;
  const deleteWasConfirmed = confirm(`Press OK to delete room: ${roomId}. You cannot undo thus change. (However, the change will not be saved until you export your game data.)`);

  if (!deleteWasConfirmed) {
    return;
  }

  $('body').removeChild(roomCard);
  updateData();
};

const addExit = (exitList) => {
  const exit = document.createElement('div');
  exit.classList.add('exit');
  exit.innerHTML = `
    <span class="dir" contenteditable="true">directionName</span> →
    <span class="id" contenteditable="true">roomId</span>
    <sup class="deleteRoom">x</sup>
  `;
  exitList.appendChild(exit);
};

const deleteExit = (exit) => {
  $('body').removeChild(exit);
  updateData();
};

const roomCards = disk.rooms
  .map(roomData => {
    const roomCard = document.createElement('div');

    const itemList = (roomData.items || [])
      .map(item => item.name)
      .join(', ');

    const exitList = (roomData.exits || [])
      .map(exit => `
        <div class="exit">
          <span class="dir" contenteditable="true">${exit.dir}</span> →
          <span class="id" contenteditable="true">${exit.id}</span>
          <sup class="deleteExit">x</sup>
        </div>
      `)
      .join('<br>');

    roomCard.innerHTML = `
      <br>
      <span class="title">
        <span class="id" contenteditable="true">${roomData.id}</span> <sup class="deleteRoom">x</sup>
      </span>
      <br>
      <span>
        <span class="prop">NAME</span>
        <span class="value name" contenteditable="true">${roomData.name}</span>
        <br>
        <br>
        <span class="prop">DESCRIPTION</span>
        <span class="value desc" contenteditable="true">${roomData.desc}</span>
        <br>
        <br>
        <span class="prop">ITEMS</span>
        <span class="value items">${itemList}</span>
        <br>
        <br>
        <span class="prop">EXITS <sup class="addExit">+</sup></span>
        <br>
        <span class="value exits">${exitList}</span>
        <br>
        <br>
        <span class="prop">ARTWORK</span>
        <br>
        <span class="value img" contenteditable="true">${roomData.img}</span><br><br>
      </span>
    `;
    roomCard.classList.add('room'); // Style rooms
    roomCard.classList.add('resizable'); // Make them resizable

    // Make rooms draggable
    let offsetX, offsetY;

    // Move room to mouse position (maintaining mouse position relative to room)
    const move = e => {
      roomCard.style.top = `${e.clientY - offsetY}px`;
      roomCard.style.left = `${e.clientX - offsetX}px`;
    };

    roomCard.addEventListener('mousedown', e => {
      // Bring the room to the top when clicked
      roomCard.style.zIndex = zIndex++;

      // Capture mouse position relative to element
      offsetX = e.clientX - roomCard.offsetLeft;
      offsetY = e.clientY - roomCard.offsetTop;

      // Only move if clicking title bar
      if (offsetY > 30) {
        return;
      }

      $('body').addEventListener('mousemove', move);
    }, false);

    $('body').addEventListener('mouseup', (e) => {
      $('body').removeEventListener('mousemove', move);
    }, false);

    roomCard.addEventListener('mouseup', (e) => {
      $('body').removeEventListener('mousemove', move);
    }, false);

    // Delete room
    roomCard.querySelector('.deleteRoom').onclick = () => {
      deleteRoom(roomCard);
    };

    // TODO: Delete exit

    // Add exit
    roomCard.querySelector('.addExit').onclick = () => {
      console.log(roomCard.querySelector('.exits'));
      addExit(roomCard.querySelector('.exits'));
    };

    return roomCard;
  })

roomCards.forEach(r => {
  $('body').appendChild(r);
});

// Update disk data in memory to reflect what is displayed on screen
const updateData = () => {
  const toArray = (nodeList) => [].slice.call(nodeList);
  const roomCards = toArray(document.querySelectorAll('.room'));

  // TODO: If user changes name of starting room, update starting roomId
  disk.rooms = roomCards.map((roomCard, i) => {
    const roomData = disk.rooms[i];
    const getVal = (className) => roomCard.querySelector(className).innerText;

    const exits = toArray(roomCard.querySelectorAll('.exit'))
      .filter(exit => (exit.querySelector('.dir'))) // TODO: why this?
      .map(exit => ({
        dir: exit.querySelector('.dir').innerText,
        id: exit.querySelector('.id').innerText,
      }));

    return Object.assign(roomData, {
      id: getVal('.id'),
      name: getVal('.name'),
      desc: getVal('.desc'),
      img: getVal('.img'),
      exits,
    });
  });
};

$('body').addEventListener('keyup', updateData);

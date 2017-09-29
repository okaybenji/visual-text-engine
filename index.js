console.log(unlimitedAdventure); // Debugging

const $ = (query) => document.querySelector(query);

// zIndex is used to always bring the last-clicked room to the top
let zIndex = unlimitedAdventure.rooms.length;

unlimitedAdventure.rooms
  .map(roomData => {
    const roomCard = document.createElement('div');

    roomCard.innerHTML = `
      <br>
      <span class="title" contenteditable="true">${roomData.id}</span>
      <br>
      <span>
        <span class="prop">NAME</span>
        <span class="value" contenteditable="true">${roomData.name}</span>
        <br>
        <br>
        <span class="prop">DESCRIPTION</span>
        <span class="value" contenteditable="true">${roomData.desc}</span>
        <br>
        <br>
        <span class="prop">ARTWORK</span>
        <br>
        <span class="apple" contenteditable="true">${roomData.img}</span><br><br>
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

    return roomCard;
  })
  .forEach(r => {
    $('main').appendChild(r);
  });

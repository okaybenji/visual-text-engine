console.log(unlimitedAdventure); // Debugging

const $ = (query) => document.querySelector(query);

unlimitedAdventure.rooms
  .map(roomData => {
    const room = document.createElement('div');

    room.innerHTML = `<h1>${roomData.name}</h1>`;
    room.classList.add('room'); // Style rooms
    room.classList.add('resizable'); // Make them resizable

    // Make rooms draggable
    let offsetX, offsetY;

    // Move room to mouse position (maintaining mouse position relative to room)
    const move = e => {
      room.style.top = `${e.clientY - offsetY}px`;
      room.style.left = `${e.clientX - offsetX}px`;
    };

    room.addEventListener('mousedown', e => {
      // Capture mouse position relative to element
      offsetX = e.clientX - room.offsetLeft;
      offsetY = e.clientY - room.offsetTop;

      // Allow clicking the corner to resize the room (without moving it)
      if (offsetX > room.offsetWidth - 10 && offsetY > room.offsetHeight - 10) {
        return;
      }
      $('body').addEventListener('mousemove', move);
    }, false);

    $('body').addEventListener('mouseup', (e) => {
      $('body').removeEventListener('mousemove', move);
    }, false);

    room.addEventListener('mouseup', (e) => {
      $('body').removeEventListener('mousemove', move);
    }, false);

    return room;
  })
  .forEach(r => {
    $('main').appendChild(r);
  });

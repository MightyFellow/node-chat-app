const socket = io();

//receive an event that server is sending to us we use "on" method
// socket.on("countUpdated", (count) => {
//   console.log("The count has been updated to " + count);
// });

// document.getElementById("increment").addEventListener("click", () => {
//   console.log("Clicked");
//   socket.emit("increment");
// });

// Elements
const $messageForm = document.getElementById("my-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $locationButton = document.getElementById("send-location");
const $messages = document.querySelector("#messages");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
  //New message element
  const $newMessage = $messages.lastElementChild;

  //height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  //Visible Height
  const visibleHeight = $messages.offsetHeight;

  //Height of messages container
  const containerHeight = $messages.scrollHeight;

  // How far have i scrolled ?
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on("locationMessage", (location) => {
  const html = Mustache.render(locationTemplate, {
    username: location.username,
    URL: location.URL,
    createdAt: moment(location.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
});

socket.on("message", (greeting) => {
  const html = Mustache.render(messageTemplate, {
    username: greeting.username,
    message: greeting.text,
    createdAt: moment(greeting.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.querySelector("#sidebar").innerHTML = html;
});

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  //disable button
  $messageFormButton.setAttribute("disabled", "disabled");

  const message = e.target.elements.message.value;
  socket.emit("sendMessage", message, (error) => {
    //enable button event
    $messageFormButton.removeAttribute("disabled");
    //set input to empty string and set focus
    $messageFormInput.value = "";
    $messageFormInput.focus();

    if (error) {
      return console.log(error);
    }
    console.log("Message delivered");
  });
});

document.getElementById("send-location").addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Gelocation is not supported by your browser.");
  }
  $locationButton.setAttribute("disabled", "disabled");
  navigator.geolocation.getCurrentPosition(({ coords }) => {
    socket.emit(
      "sendLocation",
      {
        latitude: coords.latitude,
        longitude: coords.longitude,
      },
      () => {
        console.log("Location shared!");
        $locationButton.removeAttribute("disabled");
      }
    );
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});

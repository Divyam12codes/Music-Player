console.log("Music Player Loaded");

// Global variables
let currentSong = new Audio();
let songs = [];
let currentFolder = "";
let currentIndex = 0;

// Convert seconds → mm:ss format
function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
async function getSongs(folder) {
  try {
    currentFolder = folder;
    const res = await fetch(`${folder}/info.json`);
    if (!res.ok) throw new Error("Missing info.json");
    const data = await res.json();

    // Support .mp3 and .m4a
    songs = data.songs.filter(song =>
      song.toLowerCase().endsWith(".mp3") || song.toLowerCase().endsWith(".m4a")
    );

    // Populate sidebar
    const songUL = document.querySelector(".songList ul");
    if (!songUL) {
      console.error("Missing .songList ul in HTML!");
      return;
    }

    songUL.innerHTML = "";
    songs.forEach((song, i) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <img class="invert" width="34" src="img/music.svg">
        <div class="info"><div>${song.replace(/\.[^/.]+$/, "")}</div></div>
        <div class="playnow">
          <span>Play</span>
          <img class="invert" src="img/play.svg">
        </div>`;
      li.addEventListener("click", () => playMusic(song, i));
      songUL.appendChild(li);
    });

    // Auto-load first song (don’t play yet)
    if (songs.length > 0) playMusic(songs[0], 0, true);
  } catch (e) {
    console.error("Error fetching songs:", e);
    alert(`Could not load songs from ${folder}. Make sure info.json exists.`);
  }
}
function playMusic(songName, index = 0, pause = false) {
  currentIndex = index;
  currentSong.src = `${currentFolder}/${songName}`;
  document.querySelector(".songinfo").innerText = decodeURIComponent(songName);
  document.querySelector(".songtime").innerText = "00:00 / 00:00";

  if (!pause) currentSong.play();

  const playBtn = document.getElementById("play");
  playBtn.src = currentSong.paused ? "img/play.svg" : "img/pause.svg";
}

async function displayAlbums() {
  const folders = [
    "Arijit",
    "Bollywood",
    "Darshan Magic",
    "Diljit",
    "English",
    "Honey singh",
    "karan aujla",
    "Mankirat Aulakh",
    "Parmish Verma"
  ];

  const container = document.querySelector(".cardContainer");
  if (!container) {
    console.error("Missing .cardContainer in HTML!");
    return;
  }

  container.innerHTML = "";

  for (const folder of folders) {
    try {
      const res = await fetch(`songs/${folder}/info.json`);
      if (!res.ok) continue;
      const data = await res.json();

      const card = document.createElement("div");
      card.classList.add("card");
      card.dataset.folder = folder;
      card.innerHTML = `
        <img src="songs/${folder}/cover.jpg" alt="">
        <h2>${data.title || folder}</h2>
        <p>${data.description || "Click to view songs"}</p>`;
      card.addEventListener("click", () => getSongs(`songs/${folder}`));
      container.appendChild(card);
    } catch {
      console.warn(`Skipping ${folder} — no info.json`);
    }
  }
}

function setupControls() {
  const playBtn = document.getElementById("play");
  const nextBtn = document.getElementById("next");
  const prevBtn = document.getElementById("previous");
  const volumeRange = document.querySelector(".range input");
  const volumeIcon = document.querySelector(".volume img");
  const seekbar = document.querySelector(".seekbar");
  const circle = document.querySelector(".circle");

  // Play / Pause
  playBtn.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      playBtn.src = "img/pause.svg";
    } else {
      currentSong.pause();
      playBtn.src = "img/play.svg";
    }
  });

  // Next
  nextBtn.addEventListener("click", () => {
    if (currentIndex < songs.length - 1) {
      currentIndex++;
      playMusic(songs[currentIndex], currentIndex);
    }
  });

  // Previous
  prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
      playMusic(songs[currentIndex], currentIndex);
    }
  });

  // Seekbar update
  currentSong.addEventListener("timeupdate", () => {
    if (isNaN(currentSong.duration)) return;
    document.querySelector(".songtime").innerText =
      `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
    circle.style.left = `${(currentSong.currentTime / currentSong.duration) * 100}%`;
  });

  // Seek when clicked
  seekbar.addEventListener("click", e => {
    const percent = e.offsetX / e.target.clientWidth;
    currentSong.currentTime = percent * currentSong.duration;
  });

  // Volume slider
  volumeRange.addEventListener("input", e => {
    currentSong.volume = e.target.value / 100;
    volumeIcon.src = currentSong.volume === 0 ? "img/mute.svg" : "img/volume.svg";
  });

  // Mute/unmute
  volumeIcon.addEventListener("click", () => {
    if (currentSong.volume > 0) {
      currentSong.volume = 0;
      volumeRange.value = 0;
      volumeIcon.src = "img/mute.svg";
    } else {
      currentSong.volume = 0.1;
      volumeRange.value = 10;
      volumeIcon.src = "img/volume.svg";
    }
  });
}

async function main() {
  await displayAlbums();
  setupControls();
}

document.addEventListener("DOMContentLoaded", main);

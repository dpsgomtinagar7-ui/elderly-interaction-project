/* ===========================================
   Elderly Tech Companion - JS Functionality
   =========================================== */

// Smooth scrolling
function scrollToSection(id) {
  document.getElementById(id).scrollIntoView({ behavior: "smooth" });
}

/* ----------------------------
   1. Voice Assistant (Stub)
-----------------------------*/
const voiceBtn = document.getElementById("voiceBtn");
const voiceOutput = document.getElementById("voiceOutput");
if (voiceBtn) {
  const recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (recognition) {
    const recog = new recognition();
    recog.lang = "en-US";
    recog.onresult = (e) => {
      const text = e.results[0][0].transcript;
      voiceOutput.textContent = "You said: " + text;
    };
    voiceBtn.onclick = () => {
      recog.start();
      voiceOutput.textContent = "Listening...";
    };
  } else {
    voiceOutput.textContent = "Speech recognition not supported.";
  }
}

/* ----------------------------
   2. Reminders
-----------------------------*/
const reminders = [];
const reminderList = document.getElementById("reminderList");
const addReminder = document.getElementById("addReminder");
if (addReminder) {
  addReminder.onclick = () => {
    const text = document.getElementById("reminderText").value;
    const time = document.getElementById("reminderTime").value;
    if (!text || !time) return alert("Please fill in both fields!");
    reminders.push({ text, time });
    renderReminders();
  };
}
function renderReminders() {
  reminderList.innerHTML = "";
  reminders.forEach((r) => {
    const li = document.createElement("li");
    li.textContent = `${r.time} - ${r.text}`;
    reminderList.appendChild(li);
  });
}

/* ----------------------------
   3. Text to Speech (Deepgram)
-----------------------------*/
const ttsBtn = document.getElementById("ttsBtn");
if (ttsBtn) {
  ttsBtn.onclick = async () => {
    const text = document.getElementById("ttsInput").value;
    if (!text) return;
    await fetch("/speak", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ text })
    });
  };
}

/* ----------------------------
   4. Feedback
-----------------------------*/
const sendFeedback = document.getElementById("sendFeedback");
if (sendFeedback) {
  sendFeedback.onclick = async () => {
    const name = document.getElementById("fbName").value;
    const msg = document.getElementById("fbMsg").value;
    const res = await fetch("/feedback", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ name, message: msg })
    });
    const data = await res.json();
    document.getElementById("fbResponse").textContent = 
      data.status === "ok" ? "Feedback sent. Thank you!" : "Error sending feedback.";
  };
}

/* ----------------------------
   5. Magnifier
-----------------------------*/
function zoomIn() { document.body.style.zoom = (parseFloat(document.body.style.zoom || 1) + 0.1).toFixed(1); }
function zoomOut() { document.body.style.zoom = (parseFloat(document.body.style.zoom || 1) - 0.1).toFixed(1); }

/* ----------------------------
   6. Settings
-----------------------------*/
function toggleTheme() { document.body.classList.toggle("dark-mode"); }
function increaseFont() { document.body.style.fontSize = "larger"; }
function decreaseFont() { document.body.style.fontSize = "smaller"; }

/* ----------------------------
   7. Memory Game
-----------------------------*/
const memoryContainer = document.getElementById("memoryGame");
const startMemory = document.getElementById("startMemory");
if (startMemory && memoryContainer) {
  const icons = ["🍎","🍌","🍇","🍓","🍒","🍎","🍌","🍇"];
  let flipped = [];
  startMemory.onclick = () => {
    memoryContainer.innerHTML = "";
    icons.sort(() => 0.5 - Math.random());
    icons.forEach(icon => {
      const card = document.createElement("div");
      card.className = "memory-card";
      card.onclick = () => flipCard(card, icon);
      memoryContainer.appendChild(card);
    });
  };
  function flipCard(card, icon) {
    if (flipped.length < 2 && !card.classList.contains("flipped")) {
      card.classList.add("flipped");
      card.textContent = icon;
      flipped.push({ card, icon });
      if (flipped.length === 2) {
        setTimeout(checkMatch, 600);
      }
    }
  }
  function checkMatch() {
    const [a,b] = flipped;
    if (a.icon === b.icon) {
      a.card.style.background = "#4caf50";
      b.card.style.background = "#4caf50";
    } else {
      a.card.classList.remove("flipped");
      b.card.classList.remove("flipped");
      a.card.textContent = "";
      b.card.textContent = "";
    }
    flipped = [];
  }
}

/* ----------------------------
   8. Weather
-----------------------------*/
const weatherBtn = document.getElementById("getWeather");
if (weatherBtn) {
  weatherBtn.onclick = async () => {
    try {
      const res = await fetch("https://api.weatherapi.com/v1/current.json?key=demo&q=London");
      const data = await res.json();
      document.getElementById("weatherResult").textContent =
        `Weather in ${data.location.name}: ${data.current.temp_c}°C, ${data.current.condition.text}`;
    } catch (err) {
      document.getElementById("weatherResult").textContent = "Could not load weather.";
    }
  };
}

/* ----------------------------
   9. Chatbot (Gemini)
-----------------------------*/
let lastReply = "";
const chatBtn = document.getElementById("chatBtn");
if (chatBtn) {
  chatBtn.onclick = async () => {
    const input = document.getElementById("chatInput").value.trim();
    if (!input) return;
    document.getElementById("chatOutput").textContent = "Thinking...";
    const res = await fetch("/chat", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ prompt: input })
    });
    const data = await res.json();
    document.getElementById("chatOutput").textContent = data.reply;
    lastReply = data.reply;
  };
}
const speakBtn = document.getElementById("speakBtn");
if (speakBtn) {
  speakBtn.onclick = async () => {
    if (!lastReply) return alert("No reply yet!");
    await fetch("/speak", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ text: lastReply })
    });
  };
}

/* ----------------------------
   10. Summarizer
-----------------------------*/
const sumBtn = document.getElementById("sumBtn");
if (sumBtn) {
  sumBtn.onclick = async () => {
    const text = document.getElementById("sumInput").value.trim();
    if (!text) return;
    const res = await fetch("/summarize", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    document.getElementById("sumOutput").textContent = data.summary;
  };
}

/* ----------------------------
   11. Accessibility
-----------------------------*/
const highContrast = document.getElementById("highContrast");
if (highContrast) {
  highContrast.onchange = () => {
    document.body.classList.toggle("high-contrast", highContrast.checked);
  };
}

/* ----------------------------
   12. News
-----------------------------*/
const newsBtn = document.getElementById("loadNews");
if (newsBtn) {
  newsBtn.onclick = async () => {
    const res = await fetch("https://inshortsapi.vercel.app/news?category=national");
    const data = await res.json();
    const list = document.getElementById("newsList");
    list.innerHTML = "";
    data.data.slice(0,5).forEach(n => {
      const li = document.createElement("li");
      li.textContent = n.title;
      list.appendChild(li);
    });
  };
}

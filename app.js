const state = {
  playerName: "",
  sessionId: crypto.randomUUID(),
  playerRowId: null,
  supabase: null,
  room1Attempts: [],
  room2Attempts: [],
  room3Attempts: [],
  room1Selected: new Set(),
  room3Selected: new Set(),
  room1Digits: {},
};

const ROOM_1_ITEMS = [
  ["Event Name", "Gastroenterology Scientific Exchange 2025", false],
  ["Event Date", "18 Nov 2025", false],
  ["Venue", "Chengdu Jinjiang Conference Center", false],
  ["Event Coordinator", "Medical Affairs Team", false],
  ["Phone Number", "+86 138 4423 8888", true, "3"],
  ["Email Address", "wang_li@wchospital.cn", true, "1"],
  ["ETMS Code", "ETMS-HCP-04721", true, "7"],
  ["Bank Account", "6217 0001 8823 1234", true, "9"],
];

const ROOM_3_FIELDS = [
  ["Attendee ID", "HCP-2025-0834", false],
  ["City", "Chengdu", false],
  ["Arrival Time", "17 Nov 2025 – 14:30", false],
  ["Hotel Check-in Date", "17 Nov 2025", false],
  ["Dietary Requirement", "Vegetarian", false],
  ["Mobile Number", "+86 138 4423 8888", false],
  ["Specialty", "Gastroenterology", true],
  ["Congress Speaking History", "Speaker – Provincial IBD Forum (Oct 2025)", true],
  ["Internal Engagement Score", "8.7 / 10", true],
  ["Internal CRM note", "High scientific influence, low digital responsiveness", true],
  ["Airport Pickup Needed", "Yes", false],
];

const ui = {
  entrance: document.getElementById("entrance"),
  room1: document.getElementById("room1"),
  room2: document.getElementById("room2"),
  room3: document.getElementById("room3"),
  final: document.getElementById("final"),
  playerName: document.getElementById("playerName"),
  nameError: document.getElementById("nameError"),
  startBtn: document.getElementById("startBtn"),
  typingInstruction: document.getElementById("typingInstruction"),
  supabaseUrl: document.getElementById("supabaseUrl"),
  supabaseAnonKey: document.getElementById("supabaseAnonKey"),
  room1Items: document.getElementById("room1Items"),
  revealedDigits: document.getElementById("revealedDigits"),
  room1CodeInput: document.getElementById("room1CodeInput"),
  room1UnlockBtn: document.getElementById("room1UnlockBtn"),
  room1Feedback: document.getElementById("room1Feedback"),
  drawer: document.getElementById("drawer"),
  room2Feedback: document.getElementById("room2Feedback"),
  comboBtns: Array.from(document.querySelectorAll(".combo-btn")),
  laptopPanel: document.getElementById("laptopPanel"),
  laptopPassword: document.getElementById("laptopPassword"),
  unlockLaptopBtn: document.getElementById("unlockLaptopBtn"),
  laptopFeedback: document.getElementById("laptopFeedback"),
  room3Fields: document.getElementById("room3Fields"),
  submitRoom3: document.getElementById("submitRoom3"),
  room3Feedback: document.getElementById("room3Feedback"),
  finalName: document.getElementById("finalName"),
};

function showPanel(panel) {
  [ui.entrance, ui.room1, ui.room2, ui.room3, ui.final].forEach((el) => {
    el.classList.add("hidden");
    el.classList.remove("active-panel");
  });
  panel.classList.remove("hidden");
  panel.classList.add("active-panel");
}

function typeSequence(lines, index = 0, charIndex = 0) {
  if (index >= lines.length) {
    setTimeout(() => showPanel(ui.room1), 400);
    return;
  }
  const current = lines[index];
  if (charIndex === 0) {
    ui.typingInstruction.innerHTML += `<p></p>`;
  }
  const p = ui.typingInstruction.querySelectorAll("p")[index];
  p.textContent = current.slice(0, charIndex + 1);

  if (charIndex < current.length - 1) {
    setTimeout(() => typeSequence(lines, index, charIndex + 1), 28);
  } else {
    setTimeout(() => typeSequence(lines, index + 1, 0), 240);
  }
}

async function initSupabasePlayer() {
  const url = ui.supabaseUrl.value.trim();
  const key = ui.supabaseAnonKey.value.trim();

  if (!url || !key || !window.supabase?.createClient) {
    return;
  }

  state.supabase = window.supabase.createClient(url, key);
  const payload = {
    player_name: state.playerName,
    session_id: state.sessionId,
    room1_clicks: "",
    room1_success: false,
    room2_selections: "",
    room2_success: false,
    room3_removed_fields: "",
    room3_success: false,
    completed: false,
  };

  const { data, error } = await state.supabase
    .from("privacy_detective_sessions")
    .insert(payload)
    .select("id")
    .single();

  if (!error && data?.id) {
    state.playerRowId = data.id;
  }
}

async function updateSessionRecord(values) {
  if (!state.supabase || !state.playerRowId) {
    return;
  }

  await state.supabase
    .from("privacy_detective_sessions")
    .update(values)
    .eq("id", state.playerRowId);
}

function renderRoom1() {
  ui.room1Items.innerHTML = "";
  ROOM_1_ITEMS.forEach(([label, value, isDirect, digit]) => {
    const btn = document.createElement("button");
    btn.className = "sheet-item";
    btn.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    btn.addEventListener("click", () => {
      const key = label;
      if (state.room1Selected.has(key)) {
        state.room1Selected.delete(key);
        btn.classList.remove("selected");
      } else {
        state.room1Selected.add(key);
        btn.classList.add("selected");
      }

      if (isDirect) {
        state.room1Digits[key] = digit;
      }
      updateDigits();
    });
    ui.room1Items.appendChild(btn);
  });
}

function updateDigits() {
  const selectedDirectDigits = ROOM_1_ITEMS.filter(
    ([label, , isDirect]) => isDirect && state.room1Selected.has(label)
  ).map(([label]) => state.room1Digits[label]);

  ui.revealedDigits.textContent = selectedDirectDigits.join("").padEnd(4, "-");
}

function setupRoom2() {
  ui.comboBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const combo = btn.dataset.combo;
      state.room2Attempts.push(combo);

      if (combo === "B") {
        ui.room2Feedback.textContent =
          "Correct. Even without names or contact details, a person can become identifiable when location, specialty, role, and professional activity are combined.";
        ui.laptopPanel.classList.remove("hidden");
        updateSessionRecord({
          room2_selections: state.room2Attempts.join(","),
          room2_success: true,
        });
      } else if (combo === "A") {
        ui.room2Feedback.textContent = "This combination is too broad to identify a specific individual.";
        updateSessionRecord({ room2_selections: state.room2Attempts.join(",") });
      } else {
        ui.room2Feedback.textContent =
          "These details describe preferences, but they do not uniquely identify the HCP.";
        updateSessionRecord({ room2_selections: state.room2Attempts.join(",") });
      }
    });
  });
}

function renderRoom3() {
  ui.room3Fields.innerHTML = "";
  ROOM_3_FIELDS.forEach(([label, value]) => {
    const btn = document.createElement("button");
    btn.className = "sheet-item";
    btn.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    btn.addEventListener("click", () => {
      if (state.room3Selected.has(label)) {
        state.room3Selected.delete(label);
        btn.classList.remove("selected");
      } else {
        state.room3Selected.add(label);
        btn.classList.add("selected");
      }
    });
    ui.room3Fields.appendChild(btn);
  });
}

ui.startBtn.addEventListener("click", async () => {
  state.playerName = ui.playerName.value.trim();
  ui.nameError.textContent = "";
  ui.typingInstruction.innerHTML = "";

  if (!state.playerName) {
    ui.nameError.textContent = "English name is required before entering the office.";
    return;
  }

  await initSupabasePlayer();
  typeSequence([
    "Entering the Privacy Detective Office …",
    "You must solve three privacy cases to unlock the title of ‘Privacy Detective’.",
    "Inspect the evidence carefully.",
    "Unlock each case to move forward.",
  ]);
});

ui.room1UnlockBtn.addEventListener("click", async () => {
  const enteredCode = ui.room1CodeInput.value.trim();
  const selectedLabels = [...state.room1Selected];
  state.room1Attempts.push(selectedLabels.join("|") || "none");

  const selectedCorrect = ROOM_1_ITEMS.filter(([label, , isDirect]) => isDirect && state.room1Selected.has(label));
  const hasExactlyFour = state.room1Selected.size === 4;
  const allCorrect = selectedCorrect.length === 4 && hasExactlyFour;
  const revealed = selectedCorrect.map(([label, , , d]) => state.room1Digits[label] || d);
  const validCode = revealed.length === 4 && enteredCode.length === 4 && enteredCode.split("").every((c) => revealed.includes(c));

  if (allCorrect && validCode) {
    ui.room1Feedback.textContent = "Correct. These items directly identify the HCP.";
    ui.drawer.classList.remove("locked");
    ui.drawer.classList.add("unlocked");
    await updateSessionRecord({
      room1_clicks: state.room1Attempts.join(","),
      room1_success: true,
    });
    setTimeout(() => showPanel(ui.room2), 700);
  } else {
    ui.room1Feedback.textContent =
      "Some of the selected information describes the event rather than the individual.";
    ui.drawer.classList.add("jiggle");
    setTimeout(() => ui.drawer.classList.remove("jiggle"), 400);
    await updateSessionRecord({ room1_clicks: state.room1Attempts.join(",") });
  }
});

ui.unlockLaptopBtn.addEventListener("click", async () => {
  if (ui.laptopPassword.value.trim().toUpperCase() === "IDENTIFY") {
    ui.laptopFeedback.textContent = "Laptop unlocked.";
    await updateSessionRecord({ room2_success: true });
    showPanel(ui.room3);
  } else {
    ui.laptopFeedback.textContent = "Password incorrect. Investigate the profile clue again.";
  }
});

ui.submitRoom3.addEventListener("click", async () => {
  const selected = [...state.room3Selected];
  state.room3Attempts.push(selected.join("|") || "none");

  const correctSet = new Set([
    "Specialty",
    "Congress Speaking History",
    "Internal Engagement Score",
    "Internal CRM note",
  ]);

  const valid = selected.length === 4 && selected.every((item) => correctSet.has(item));

  if (valid) {
    ui.room3Feedback.textContent =
      "Correct. Only the data necessary for the agency’s task should be shared. The dataset has been cleared.";
    await updateSessionRecord({
      room3_removed_fields: state.room3Attempts.join(","),
      room3_success: true,
      completed: true,
      final_result: "Certified Privacy Detective",
    });

    ui.finalName.textContent = `${state.playerName}, you are now a certified Privacy Detective.`;
    setTimeout(() => showPanel(ui.final), 900);
  } else {
    ui.room3Feedback.textContent = "Some of the removed information is required for event logistics.";
    await updateSessionRecord({ room3_removed_fields: state.room3Attempts.join(",") });
  }
});

renderRoom1();
setupRoom2();
renderRoom3();

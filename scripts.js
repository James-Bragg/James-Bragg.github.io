document.addEventListener("DOMContentLoaded", function () {

    // === NAVIGATION TOGGLE ===
    const navToggle = document.querySelector(".nav-toggle");
    const navRight = document.querySelector(".nav-right");

    navToggle.addEventListener("click", function () {
        navRight.classList.toggle("active");
        navToggle.classList.toggle("active");
    });


    // === ELEMENT REFERENCES ===
    const addPlayerForm = document.getElementById("addPlayerForm");
    const sessionPlayersList = document.getElementById("sessionPlayersList");
    const clearSessionBtn = document.getElementById("clearSessionBtn");
    const removeFromSessionBtn = document.getElementById("removeFromSessionBtn");
    const initiativeEntries = document.getElementById("initiativeEntries");
    const startRoundBtn = document.querySelector(".start-round-btn");
    const initiativeOrderContainer = document.getElementById("initiativeOrder");
    const prevTurnBtn = document.getElementById("prevTurnBtn");
    const nextTurnBtn = document.getElementById("nextTurnBtn");


    // === GAME STATE ===
    let currentTurnIndex = 0;
    let initiativeGroups = [];

    const defaultPlayerNames = ["Enemy", "Friend", "Emma", "Damian", "Dom", "Ryan", "David", "World", "James"];


    // === LOCAL STORAGE FUNCTIONS ===
    function saveToLocalStorage() {
        const players = Array.from(sessionPlayersList.querySelectorAll("li")).map(li => li.textContent);
        const bonuses = {};
        initiativeEntries.querySelectorAll(".initiative-entry").forEach(entry => {
            const name = entry.querySelector("label").textContent;
            const bonus = entry.querySelector("input.bonus").value || "0";
            bonuses[name] = bonus;
        });
        localStorage.setItem("players", JSON.stringify(players));
        localStorage.setItem("bonuses", JSON.stringify(bonuses));
    }

    function loadFromLocalStorage() {
        const players = JSON.parse(localStorage.getItem("players")) || [];
        const bonuses = JSON.parse(localStorage.getItem("bonuses")) || {};
        players.forEach(name => addPlayerByName(name, bonuses[name]));
    }


    // === PLAYER MANAGEMENT ===
    function addPlayerByName(playerName, bonus = "") {
        if (isDuplicateName(playerName)) return;

        const playerId = `player-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        const li = document.createElement("li");
        li.textContent = playerName;
        li.classList.add("player-item");
        li.addEventListener("click", function () {
            li.classList.toggle("selected");
        });
        sessionPlayersList.appendChild(li);

        const initiativeEntry = document.createElement("li");
        initiativeEntry.classList.add("initiative-entry");

        const label = document.createElement("label");
        label.textContent = playerName;
        label.setAttribute("for", playerId);

        const input = document.createElement("input");
        input.type = "number";
        input.min = "1";
        input.max = "60";
        input.id = playerId;
        input.name = `initiative-${playerName}`;
        input.autocomplete = "off";

        const bonusInput = document.createElement("input");
        bonusInput.type = "number";
        bonusInput.classList.add("bonus");
        bonusInput.placeholder = "+bonus";
        bonusInput.value = bonus;
        bonusInput.style.width = "60px";

        initiativeEntry.appendChild(label);
        initiativeEntry.appendChild(input);
        initiativeEntry.appendChild(bonusInput);
        initiativeEntries.appendChild(initiativeEntry);

        saveToLocalStorage();
    }

    function updateCurrentTurn() {
        const cards = initiativeOrderContainer.querySelectorAll(".card");
        cards.forEach(card => {
            const groupIndex = parseInt(card.dataset.groupIndex, 10);
            card.classList.toggle("highlight", groupIndex === currentTurnIndex);
        });
    }

    function isDuplicateName(playerName) {
        const existingPlayers = Array.from(sessionPlayersList.querySelectorAll("li")).map(li => li.textContent.toLowerCase());
        return existingPlayers.includes(playerName.toLowerCase());
    }

    function updateButtonVisibility() {
        if (initiativeEntries.querySelectorAll(".initiative-entry").length === 0) {
            startRoundBtn.style.display = "none";
        } else {
            startRoundBtn.style.display = "inline-block";
        }

        if (initiativeGroups.length > 1) {
            prevTurnBtn.style.display = "inline-block";
            nextTurnBtn.style.display = "inline-block";
        } else {
            prevTurnBtn.style.display = "none";
            nextTurnBtn.style.display = "none";
        }
    }


    // === EVENT LISTENERS ===
    if (addPlayerForm) {
        addPlayerForm.addEventListener("submit", function (event) {
            event.preventDefault();
            const playerNameInput = addPlayerForm.querySelector('input[name="name"]');
            const playerName = playerNameInput.value.trim();

            if (!playerName) {
                alert("Player name cannot be empty. Please enter a valid name.");
                return;
            }

            if (isDuplicateName(playerName)) {
                alert("Player name already exists. Please enter a different name.");
                return;
            }

            addPlayerByName(playerName);
            playerNameInput.value = "";
            updateButtonVisibility();
        });
    }

    if (clearSessionBtn) {
        clearSessionBtn.addEventListener("click", function () {
            if (confirm("Are you sure you want to clear the session? This action cannot be undone.")) {
                sessionPlayersList.innerHTML = "";
                initiativeEntries.innerHTML = "";
                initiativeOrderContainer.innerHTML = "";
                currentTurnIndex = 0;
                initiativeGroups = [];
                localStorage.clear();
                updateButtonVisibility();
            }
        });
    }

    // Reset to Defaults Button
    const resetToDefaultsBtn = document.createElement("button");
    resetToDefaultsBtn.textContent = "Reset to Defaults";
    resetToDefaultsBtn.setAttribute("title", "Clear everything and load default players");
    resetToDefaultsBtn.style.marginTop = "10px";
    clearSessionBtn.parentElement.appendChild(resetToDefaultsBtn);

    resetToDefaultsBtn.addEventListener("click", function () {
        if (confirm("Reset everything and load default players?")) {
            sessionPlayersList.innerHTML = "";
            initiativeEntries.innerHTML = "";
            initiativeOrderContainer.innerHTML = "";
            currentTurnIndex = 0;
            initiativeGroups = [];
            localStorage.clear();
            defaultPlayerNames.forEach(name => addPlayerByName(name));
            updateButtonVisibility();
        }
    });


    // === INITIATIVE ROUND LOGIC ===
    if (startRoundBtn) {
        startRoundBtn.addEventListener("click", function (event) {
            event.preventDefault();

            const initiativeList = [];
            const entries = initiativeEntries.querySelectorAll(".initiative-entry");

            entries.forEach(entry => {
                const playerName = entry.querySelector("label").textContent;
                const rollValue = parseInt(entry.querySelector("input[type='number']").value, 10);
                const bonusValue = parseInt(entry.querySelector("input.bonus").value, 10) || 0;
                const total = (isNaN(rollValue) ? 0 : rollValue) + bonusValue;
                if (!isNaN(total) && total >= 1) {
                    initiativeList.push({ name: playerName, roll: total });
                }
            });

            if (initiativeList.length === 0) {
                alert("No valid initiative rolls entered. Please enter initiative rolls before starting the round.");
                console.error("No initiative rolls to display.");
                return;
            }

            initiativeList.sort((a, b) => b.roll - a.roll);

            initiativeGroups = [];
            let currentGroup = [];
            let currentRoll = initiativeList[0].roll;

            initiativeList.forEach((player) => {
                if (player.roll !== currentRoll) {
                    initiativeGroups.push(currentGroup);
                    currentGroup = [];
                    currentRoll = player.roll;
                }
                currentGroup.push(player);
            });
            initiativeGroups.push(currentGroup);

            initiativeOrderContainer.innerHTML = "";

            initiativeGroups.forEach((group, groupIndex) => {
                group.forEach(player => {
                    const card = document.createElement("div");
                    card.classList.add("card");
                    card.dataset.groupIndex = groupIndex;

                    const nameElement = document.createElement("div");
                    nameElement.classList.add("player-name");
                    nameElement.textContent = player.name;
                    card.appendChild(nameElement);

                    const rollElement = document.createElement("span");
                    rollElement.textContent = player.roll;
                    card.appendChild(rollElement);

                    initiativeOrderContainer.appendChild(card);
                });
            });

            currentTurnIndex = 0;
            updateCurrentTurn();
            updateButtonVisibility();
        });
    }


    // === TURN NAVIGATION ===
    if (prevTurnBtn) {
        prevTurnBtn.addEventListener("click", function () {
            currentTurnIndex--;
            if (currentTurnIndex < 0) {
                currentTurnIndex = initiativeGroups.length - 1;
            }
            updateCurrentTurn();
        });
    }

    if (nextTurnBtn) {
        nextTurnBtn.addEventListener("click", function () {
            currentTurnIndex++;
            if (currentTurnIndex >= initiativeGroups.length) {
                currentTurnIndex = 0;
            }
            updateCurrentTurn();
        });
    }

    updateButtonVisibility();

    // === INITIALIZATION ===
    const storedPlayers = JSON.parse(localStorage.getItem("players"));
    if (storedPlayers && storedPlayers.length > 0) {
        loadFromLocalStorage();
    } else {
        defaultPlayerNames.forEach(name => addPlayerByName(name));
    }
});
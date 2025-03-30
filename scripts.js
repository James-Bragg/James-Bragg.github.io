"use strict";

document.addEventListener("DOMContentLoaded", () => {
    // Constants for localStorage keys
    const STORAGE_PLAYERS_KEY = "dndTool_players";
    const STORAGE_BONUSES_KEY = "dndTool_bonuses";

    // Navigation Toggle
    const navToggle = document.querySelector(".nav-toggle");
    const navRight = document.querySelector(".nav-right");

    navToggle.addEventListener("click", () => {
        navRight.classList.toggle("active");
        navToggle.classList.toggle("active");
        // Update aria-expanded attribute for accessibility
        const expanded = navRight.classList.contains("active");
        navToggle.setAttribute("aria-expanded", expanded);
    });

    // DOM elements for the initiative tracker
    const addPlayerForm = document.getElementById("addPlayerForm");
    const sessionPlayersList = document.getElementById("sessionPlayersList");
    const clearSessionBtn = document.getElementById("clearSessionBtn");
    const removeFromSessionBtn = document.getElementById("removeFromSessionBtn");
    const initiativeEntries = document.getElementById("initiativeEntries");
    // Removed the old "start-round-btn" selector and replaced it with direct button IDs below.
    const initiativeOrderContainer = document.getElementById("initiativeOrder");
    const prevTurnBtn = document.getElementById("prevTurnBtn");
    const nextTurnBtn = document.getElementById("nextTurnBtn");

    let currentTurnIndex = 0;
    let initiativeGroups = [];

    const defaultPlayerData = [
        { name: "Enemy", bonus: 0 },
        { name: "Friend", bonus: 0 },
        { name: "Emma", bonus: 0 },
        { name: "Damian", bonus: 0 },
        { name: "Dom", bonus: 0 },
        { name: "Ryan", bonus: 0 },
        { name: "David", bonus: 0 },
        { name: "World", bonus: 0 },
        { name: "James", bonus: 0 }
    ];

    // Save players and their bonuses to localStorage
    function saveToLocalStorage() {
        const players = Array.from(sessionPlayersList.querySelectorAll("li")).map(li => li.textContent);
        const bonuses = {};
        initiativeEntries.querySelectorAll(".initiative-entry").forEach(entry => {
            const name = entry.querySelector("label").textContent;
            const bonus = entry.querySelector("input.bonus").value || "0";
            bonuses[name] = bonus;
        });
        localStorage.setItem(STORAGE_PLAYERS_KEY, JSON.stringify(players));
        localStorage.setItem(STORAGE_BONUSES_KEY, JSON.stringify(bonuses));
    }

    // Load players and bonuses from localStorage
    function loadFromLocalStorage() {
        const players = JSON.parse(localStorage.getItem(STORAGE_PLAYERS_KEY)) || [];
        const bonuses = JSON.parse(localStorage.getItem(STORAGE_BONUSES_KEY)) || {};
        players.forEach(name => addPlayerByName(name, bonuses[name]));
    }

    // Add a player by name and create corresponding UI elements
    function addPlayerByName(playerName, bonus = "") {
        if (isDuplicateName(playerName)) return;

        const playerId = `player-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        // Create list item for session players
        const li = document.createElement("li");
        li.textContent = playerName;
        li.classList.add("player-item");
        li.addEventListener("click", () => {
            li.classList.toggle("selected");
        });
        sessionPlayersList.appendChild(li);

        // Create initiative entry for the player
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

        initiativeEntry.appendChild(label);
        initiativeEntry.appendChild(input);
        initiativeEntry.appendChild(bonusInput);
        initiativeEntries.appendChild(initiativeEntry);

        // Save when bonus changes
        bonusInput.addEventListener("input", () => {
            saveToLocalStorage();
        });
    }

    // Update the current turn highlight in the initiative order
    function updateCurrentTurn() {
        const cards = initiativeOrderContainer.querySelectorAll(".card");
        cards.forEach(card => {
            const groupIndex = parseInt(card.dataset.groupIndex, 10);
            card.classList.toggle("highlight", groupIndex === currentTurnIndex);
        });
    }

    // Check if a player name already exists (case-insensitive)
    function isDuplicateName(playerName) {
        const existingPlayers = Array.from(sessionPlayersList.querySelectorAll("li")).map(li => li.textContent.toLowerCase());
        return existingPlayers.includes(playerName.toLowerCase());
    }

    // Update the visibility of action buttons based on the current state
    function updateButtonVisibility() {
        // If there are no initiative entries, hide the roll button.
        // (Assuming the roll button is separate, since we now use IDs for buttons.)
        const rollInitiativeBtn = document.getElementById("rollInitiativeBtn");
        if (initiativeEntries.querySelectorAll(".initiative-entry").length === 0) {
            if (rollInitiativeBtn) rollInitiativeBtn.style.display = "none";
        } else {
            if (rollInitiativeBtn) rollInitiativeBtn.style.display = "inline-block";
        }

        if (initiativeGroups.length > 1) {
            prevTurnBtn.style.display = "inline-block";
            nextTurnBtn.style.display = "inline-block";
        } else {
            prevTurnBtn.style.display = "none";
            nextTurnBtn.style.display = "none";
        }
    }

    if (removeFromSessionBtn) {
        removeFromSessionBtn.addEventListener("click", () => {
            const selectedPlayers = sessionPlayersList.querySelectorAll("li.selected");

            if (selectedPlayers.length === 0) {
                alert("Please select at least one player to remove.");
                return;
            }

            selectedPlayers.forEach(player => {
                const playerName = player.textContent;
                // Remove from session list
                player.remove();
                // Remove corresponding initiative entry
                const initiativeEntry = Array.from(initiativeEntries.children).find(entry => {
                    return entry.querySelector("label").textContent === playerName;
                });
                if (initiativeEntry) {
                    initiativeEntry.remove();
                }
            });

            // Update local storage and button visibility after removal
            saveToLocalStorage();
            updateButtonVisibility();
        });
    }

    if (addPlayerForm) {
        addPlayerForm.addEventListener("submit", event => {
            event.preventDefault();
            const playerNameInput = addPlayerForm.querySelector('input[name="name"]');
            const playerName = playerNameInput.value.trim();
            const bonusInput = addPlayerForm.querySelector('input[name="bonus"]');
            const bonus = bonusInput.value.trim();

            if (!playerName) {
                alert("Player name cannot be empty. Please enter a valid name.");
                return;
            }

            if (isDuplicateName(playerName)) {
                alert("Player name already exists. Please enter a different name.");
                return;
            }

            addPlayerByName(playerName, bonus);
            playerNameInput.value = "";
            bonusInput.value = "";
            updateButtonVisibility();
        });
    }

    if (clearSessionBtn) {
        clearSessionBtn.addEventListener("click", () => {
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

    resetToDefaultsBtn.addEventListener("click", () => {
        if (confirm("Reset everything and load default players?")) {
            sessionPlayersList.innerHTML = "";
            initiativeEntries.innerHTML = "";
            initiativeOrderContainer.innerHTML = "";
            currentTurnIndex = 0;
            initiativeGroups = [];
            localStorage.clear();
            defaultPlayerData.forEach(player => addPlayerByName(player.name, player.bonus));
            updateButtonVisibility();
        }
    });

    // ROLL INITIATIVE BUTTON
    const rollInitiativeBtn = document.getElementById("rollInitiativeBtn");
    if (rollInitiativeBtn) {
        rollInitiativeBtn.addEventListener("click", event => {
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

            // Sort by initiative roll descending
            initiativeList.sort((a, b) => b.roll - a.roll);

            initiativeGroups = [];
            let currentGroup = [];
            let currentRoll = initiativeList[0].roll;

            initiativeList.forEach(player => {
                if (player.roll !== currentRoll) {
                    initiativeGroups.push(currentGroup);
                    currentGroup = [];
                    currentRoll = player.roll;
                }
                currentGroup.push(player);
            });
            initiativeGroups.push(currentGroup);

            initiativeOrderContainer.innerHTML = "";

            // Create cards for each initiative group
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

    // CLEAR INITIATIVE BUTTON
    const clearInitiativeBtn = document.getElementById("clearInitiativeBtn");
    if (clearInitiativeBtn) {
        clearInitiativeBtn.addEventListener("click", () => {
            initiativeEntries.innerHTML = "";
            initiativeOrderContainer.innerHTML = "";
            currentTurnIndex = 0;
            initiativeGroups = [];
        });
    }

    if (prevTurnBtn) {
        prevTurnBtn.addEventListener("click", () => {
            currentTurnIndex--;
            if (currentTurnIndex < 0) {
                currentTurnIndex = initiativeGroups.length - 1;
            }
            updateCurrentTurn();
        });
    }

    if (nextTurnBtn) {
        nextTurnBtn.addEventListener("click", () => {
            currentTurnIndex++;
            if (currentTurnIndex >= initiativeGroups.length) {
                currentTurnIndex = 0;
            }
            updateCurrentTurn();
        });
    }

    // Load players from localStorage if available; otherwise load defaults
    const storedPlayers = JSON.parse(localStorage.getItem(STORAGE_PLAYERS_KEY));
    if (storedPlayers && storedPlayers.length > 0) {
        loadFromLocalStorage();
    } else {
        defaultPlayerData.forEach(player => addPlayerByName(player.name, player.bonus));
    }
    updateButtonVisibility();
});

document.addEventListener("DOMContentLoaded", function () {
    // Element references
    const addPlayerForm = document.getElementById("addPlayerForm");
    const sessionPlayersList = document.getElementById("sessionPlayersList");
    const clearSessionBtn = document.getElementById("clearSessionBtn");
    const removeFromSessionBtn = document.getElementById("removeFromSessionBtn");
    const initiativeEntries = document.getElementById("initiativeEntries");
    const startRoundBtn = document.querySelector(".start-round-btn");
    const initiativeOrderContainer = document.getElementById("initiativeOrder");
    const prevTurnBtn = document.getElementById("prevTurnBtn");
    const nextTurnBtn = document.getElementById("nextTurnBtn");

    let currentTurnIndex = 0;
    let initiativeGroups = [];

    // Function to update the current turn highlight
    function updateCurrentTurn() {
        const cards = initiativeOrderContainer.querySelectorAll(".card");
        cards.forEach(card => {
            const groupIndex = parseInt(card.dataset.groupIndex, 10);
            card.classList.toggle("highlight", groupIndex === currentTurnIndex);
        });
    }

    // Function to check for duplicate player names
    function isDuplicateName(playerName) {
        const existingPlayers = Array.from(sessionPlayersList.querySelectorAll("li")).map(li => li.textContent.toLowerCase());
        return existingPlayers.includes(playerName.toLowerCase());
    }

    // Add player to session and initiative rolls
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

            const playerId = `player-${Date.now()}`; // Unique ID for each player

            // Add player to session list
            const li = document.createElement("li");
            li.textContent = playerName;
            li.classList.add("player-item");
            li.addEventListener("click", function () {
                li.classList.toggle("selected");
            });
            sessionPlayersList.appendChild(li);

            // Add player to initiative rolls
            const initiativeEntry = document.createElement("li");
            initiativeEntry.classList.add("initiative-entry");

            const label = document.createElement("label");
            label.textContent = playerName;
            label.setAttribute("for", playerId); // Associate label with input

            const input = document.createElement("input");
            input.type = "number";
            input.min = "1";
            input.max = "20";
            input.id = playerId;
            input.name = `initiative-${playerName}`; // Unique name for each input
            input.autocomplete = "off"; // Disable autocomplete for initiative rolls

            initiativeEntry.appendChild(label);
            initiativeEntry.appendChild(input);
            initiativeEntries.appendChild(initiativeEntry);

            playerNameInput.value = ""; // Clear input field
        });
    }

    // Clear all players from session and initiative rolls
    if (clearSessionBtn) {
        clearSessionBtn.addEventListener("click", function () {
            if (confirm("Are you sure you want to clear the session? This action cannot be undone.")) {
                sessionPlayersList.innerHTML = "";
                initiativeEntries.innerHTML = "";
                initiativeOrderContainer.innerHTML = "";
                prevTurnBtn.style.display = "none";
                nextTurnBtn.style.display = "none";
                currentTurnIndex = 0;
                initiativeGroups = [];
            }
        });
    }

    // Remove selected players from session and initiative rolls
    if (removeFromSessionBtn) {
        removeFromSessionBtn.addEventListener("click", function () {
            const selectedItems = sessionPlayersList.querySelectorAll(".selected");
            if (selectedItems.length === 0) {
                alert("No players selected. Please select players to remove.");
                return;
            }
            selectedItems.forEach(item => {
                const playerName = item.textContent;
                sessionPlayersList.removeChild(item);

                // Remove corresponding initiative roll entry
                const initiativeEntry = Array.from(initiativeEntries.children).find(entry => {
                    return entry.querySelector("label").textContent === playerName;
                });
                if (initiativeEntry) {
                    initiativeEntries.removeChild(initiativeEntry);
                }
            });
        });
    }

    // Handle start round: sort and display initiative order
    if (startRoundBtn) {
        startRoundBtn.addEventListener("click", function (event) {
            event.preventDefault();

            // Gather initiative rolls and players
            const initiativeList = [];
            const entries = initiativeEntries.querySelectorAll(".initiative-entry");

            entries.forEach(entry => {
                const playerName = entry.querySelector("label").textContent;
                const rollValue = parseInt(entry.querySelector("input").value, 10);
                if (!isNaN(rollValue) && rollValue >= 1 && rollValue <= 20) {
                    initiativeList.push({ name: playerName, roll: rollValue });
                }
            });

            if (initiativeList.length === 0) {
                alert("No valid initiative rolls entered. Please enter initiative rolls before starting the round.");
                console.error("No initiative rolls to display.");
                return;
            }

            // Sort by initiative rolls (descending order) and group by roll value
            initiativeList.sort((a, b) => b.roll - a.roll);

            initiativeGroups = [];
            let currentGroup = [];
            let currentRoll = initiativeList[0].roll;

            initiativeList.forEach((player, index) => {
                if (player.roll !== currentRoll) {
                    initiativeGroups.push(currentGroup);
                    currentGroup = [];
                    currentRoll = player.roll;
                }
                currentGroup.push(player);
            });
            initiativeGroups.push(currentGroup); // Push the last group

            // Clear any existing cards in the initiative order section
            initiativeOrderContainer.innerHTML = "";

            // Display sorted initiative order in card form
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

                    // Append the card to the initiative order container
                    initiativeOrderContainer.appendChild(card);
                });
            });

            currentTurnIndex = 0;
            updateCurrentTurn();

            // Show navigation buttons
            if (initiativeGroups.length > 1) {
                prevTurnBtn.style.display = "inline-block";
                nextTurnBtn.style.display = "inline-block";
            } else {
                prevTurnBtn.style.display = "none";
                nextTurnBtn.style.display = "none";
            }
        });
    }

    // Navigate to previous turn
    if (prevTurnBtn) {
        prevTurnBtn.addEventListener("click", function () {
            currentTurnIndex--;

            if (currentTurnIndex < 0) {
                currentTurnIndex = initiativeGroups.length - 1; // Loop back to the last group
            }

            updateCurrentTurn();
        });
    }

    // Navigate to next turn
    if (nextTurnBtn) {
        nextTurnBtn.addEventListener("click", function () {
            currentTurnIndex++;

            if (currentTurnIndex >= initiativeGroups.length) {
                currentTurnIndex = 0; // Loop back to the first group
            }

            updateCurrentTurn();
        });
    }
});

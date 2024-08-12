document.addEventListener("DOMContentLoaded", function () {
    const addPlayerForm = document.getElementById("addPlayerForm");
    const sessionPlayersList = document.getElementById("sessionPlayersList");
    const clearSessionBtn = document.getElementById("clearSessionBtn");
    const removeFromSessionBtn = document.getElementById("removeFromSessionBtn");
    const initiativeEntries = document.getElementById("initiativeEntries");
    const startRoundBtn = document.querySelector(".start-round-btn");
    const initiativeOrderContainer = document.getElementById("initiativeOrder");
    const prevTurnBtn = document.getElementById("prevTurnBtn");
    const nextTurnBtn = document.getElementById("nextTurnBtn");

    let currentTurnIndex = -1;

    // Add player to session and initiative rolls
    addPlayerForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const playerNameInput = addPlayerForm.querySelector('input[name="name"]');
        const playerName = playerNameInput.value.trim();
        
        if (playerName !== "") {
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
            initiativeEntry.appendChild(label);

            const input = document.createElement("input");
            input.type = "number";
            input.min = "1";
            input.max = "20";
            initiativeEntry.appendChild(input);

            initiativeEntries.appendChild(initiativeEntry);

            playerNameInput.value = ""; // Clear input field
        }
    });

    // Clear all players from session and initiative rolls
    clearSessionBtn.addEventListener("click", function () {
        sessionPlayersList.innerHTML = "";
        initiativeEntries.innerHTML = "";
        initiativeOrderContainer.innerHTML = "";
        prevTurnBtn.style.display = "none";
        nextTurnBtn.style.display = "none";
        currentTurnIndex = -1;
    });

    // Remove selected players from session and initiative rolls
    removeFromSessionBtn.addEventListener("click", function () {
        const selectedItems = sessionPlayersList.querySelectorAll(".selected");
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

    // Handle start round: sort and display initiative order
    startRoundBtn.addEventListener("click", function (event) {
        event.preventDefault();

        // Gather initiative rolls and players
        const initiativeList = [];
        const entries = initiativeEntries.querySelectorAll(".initiative-entry");

        entries.forEach(entry => {
            const playerName = entry.querySelector("label").textContent;
            const rollValue = parseInt(entry.querySelector("input").value, 10);
            if (!isNaN(rollValue)) {
                initiativeList.push({ name: playerName, roll: rollValue });
            }
        });

        // Sort by initiative rolls (descending order)
        initiativeList.sort((a, b) => b.roll - a.roll);

        // Display sorted initiative order in card form
        initiativeOrderContainer.innerHTML = "";
        const rollGroups = {};

        initiativeList.forEach((player, index) => {
            const card = document.createElement("div");
            card.classList.add("card");
            card.dataset.index = index;

            const nameElement = document.createElement("div");
            nameElement.classList.add("player-name");
            nameElement.textContent = player.name;
            card.appendChild(nameElement);

            const rollElement = document.createElement("span");
            rollElement.textContent = player.roll;
            card.appendChild(rollElement);

            initiativeOrderContainer.appendChild(card);

            // Group players with the same roll
            if (!rollGroups[player.roll]) {
                rollGroups[player.roll] = [];
            }
            rollGroups[player.roll].push(card);
        });

        // Highlight cards with the same roll
        Object.values(rollGroups).forEach(group => {
            if (group.length > 1) {
                group.forEach(card => {
                    card.classList.add("highlight");
                });
            }
        });

        currentTurnIndex = 0;
        updateCurrentTurn();

        // Show navigation buttons
        prevTurnBtn.style.display = "inline-block";
        nextTurnBtn.style.display = "inline-block";
    });

    // Update the current turn highlight
    function updateCurrentTurn() {
        const cards = initiativeOrderContainer.querySelectorAll(".card");
        cards.forEach((card, index) => {
            card.classList.remove("highlight");
            if (index === currentTurnIndex) {
                card.classList.add("highlight");
            }
        });
    }

    // Navigate to previous turn
    prevTurnBtn.addEventListener("click", function () {
        if (currentTurnIndex > 0) {
            currentTurnIndex--;
            updateCurrentTurn();
        }
    });

    // Navigate to next turn
    nextTurnBtn.addEventListener("click", function () {
        const cards = initiativeOrderContainer.querySelectorAll(".card");
        if (currentTurnIndex < cards.length - 1) {
            currentTurnIndex++;
            updateCurrentTurn();
        }
    });
});

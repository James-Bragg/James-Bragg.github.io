document.addEventListener('DOMContentLoaded', function () {
    const savedPlayersList = document.getElementById('savedPlayersList');
    const sessionPlayersList = document.getElementById('sessionPlayersList');
    const initiativeEntries = document.getElementById('initiativeEntries');
    const addPlayerForm = document.getElementById('addPlayerForm');
    const addToSessionBtn = document.getElementById('addToSessionBtn');
    const clearSessionBtn = document.getElementById('clearSessionBtn');
    const removeFromSessionBtn = document.getElementById('removeFromSessionBtn');
    const startRoundBtn = document.querySelector('.start-round-btn');
    const initiativeOrderContainer = document.getElementById('initiativeOrder');
    const prevTurnBtn = document.getElementById('prevTurnBtn');
    const nextTurnBtn = document.getElementById('nextTurnBtn');
    const errorContainer = document.createElement('div'); // To display error messages
    let selectedPlayers = new Set();
    let initiativeOrder = [];
    let currentTurnIndex = 0;

    // Hide navigation buttons initially
    prevTurnBtn.style.display = 'none';
    nextTurnBtn.style.display = 'none';

    // Error container setup
    errorContainer.style.color = 'red';
    errorContainer.style.margin = '10px 0';
    sessionPlayersList.parentElement.insertBefore(errorContainer, sessionPlayersList);

    // Function to display error messages
    function displayError(message) {
        errorContainer.textContent = message;
        const dismissButton = document.createElement('button');
        dismissButton.textContent = 'Dismiss';
        dismissButton.style.marginLeft = '10px';
        dismissButton.addEventListener('click', () => {
            errorContainer.textContent = '';
            dismissButton.remove();
        });
        errorContainer.appendChild(dismissButton);
    }

    // Helper function to check if a player is in a list
    function isPlayerInList(playerName, list) {
        return [...list.children].some(player => player.dataset.name === playerName);
    }

    // Function to toggle player selection
    function togglePlayerSelection(event) {
        const playerName = event.target.dataset.name;
        if (selectedPlayers.has(playerName)) {
            selectedPlayers.delete(playerName);
            event.target.classList.remove('selected');
        } else {
            selectedPlayers.add(playerName);
            event.target.classList.add('selected');
        }
    }

    // Function to deselect all players
    function deselectAllPlayers() {
        selectedPlayers.clear();
        [...savedPlayersList.children, ...sessionPlayersList.children].forEach(playerElement => {
            playerElement.classList.remove('selected');
        });
    }

    // Load saved players from localStorage
    function loadSavedPlayers() {
        const savedPlayers = JSON.parse(localStorage.getItem('savedPlayers')) || [];
        savedPlayers.forEach(playerName => {
            addPlayer(playerName);
        });
    }

    // Save player to localStorage
    function savePlayer(playerName) {
        const savedPlayers = JSON.parse(localStorage.getItem('savedPlayers')) || [];
        if (!savedPlayers.includes(playerName)) {
            savedPlayers.push(playerName);
            localStorage.setItem('savedPlayers', JSON.stringify(savedPlayers));
        }
    }

    // Function to add a new player to the saved list
    function addPlayer(playerName) {
        if (!isPlayerInList(playerName, savedPlayersList)) {
            const newPlayer = document.createElement('li');
            newPlayer.classList.add('player');
            newPlayer.dataset.name = playerName;
            newPlayer.textContent = playerName;
            savedPlayersList.appendChild(newPlayer);
            savePlayer(playerName); // Save the player to localStorage
            addPlayerForm.reset();
        } else {
            displayError(`Player "${playerName}" already exists in the saved list.`);
        }
    }

    // Add player form submission
    addPlayerForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const playerName = addPlayerForm.name.value.trim();
        if (playerName) {
            addPlayer(playerName);
        }
    });

    // Function to update the initiative entries section
    function updateInitiativeEntries() {
        initiativeEntries.innerHTML = '';
        const fragment = document.createDocumentFragment();
        [...sessionPlayersList.children].forEach(playerElement => {
            const playerName = playerElement.dataset.name;
            const entryDiv = document.createElement('li');
            entryDiv.classList.add('initiative-entry');
            entryDiv.innerHTML = `
                <label for="initiative_${playerName}">${playerName}</label>
                <input type="number" id="initiative_${playerName}" name="initiative_${playerName}" min="1" max="20" required aria-label="Enter initiative for ${playerName}">
            `;
            fragment.appendChild(entryDiv);
        });
        initiativeEntries.appendChild(fragment);
    }

    // Add selected players to the session and update initiative entries
    function addPlayersToSession() {
        let anyPlayerAdded = false;
        selectedPlayers.forEach(player => {
            if (!isPlayerInList(player, sessionPlayersList)) {
                const playerElement = [...savedPlayersList.children].find(el => el.dataset.name === player);
                if (playerElement) {
                    sessionPlayersList.appendChild(playerElement.cloneNode(true));
                    playerElement.classList.remove('selected');
                    anyPlayerAdded = true;
                }
            } else {
                displayError(`Player "${player}" is already in the session.`);
            }
        });

        if (anyPlayerAdded) {
            updateInitiativeEntries();
        }

        // Deselect all players after adding to session
        deselectAllPlayers();
    }

    addToSessionBtn.addEventListener('click', addPlayersToSession);

    // Clear session players and update initiative entries
    clearSessionBtn.addEventListener('click', function () {
        sessionPlayersList.innerHTML = '';
        selectedPlayers.clear();
        updateInitiativeEntries();
    });

    // Remove selected players from session and update initiative entries
    removeFromSessionBtn.addEventListener('click', function () {
        let anyPlayerRemoved = false;
        [...sessionPlayersList.children].forEach(playerElement => {
            if (selectedPlayers.has(playerElement.dataset.name)) {
                sessionPlayersList.removeChild(playerElement);
                anyPlayerRemoved = true;
            }
        });

        if (anyPlayerRemoved) {
            updateInitiativeEntries();
        }

        // Deselect all players after removing from session
        deselectAllPlayers();
    });

    // Function to validate that all initiative values are filled
    function validateInitiativeEntries() {
        let isValid = true;
        [...initiativeEntries.children].forEach(entry => {
            const input = entry.querySelector('input');
            if (!input.value || input.value.trim() === "") {
                displayError(`Please enter an initiative value for ${entry.querySelector('label').textContent.trim()}`);
                isValid = false;
            }
        });
        return isValid;
    }

    // Function to display player cards in initiative order
    function displayPlayerCards() {
        initiativeOrderContainer.innerHTML = '';
        const currentInitiativeValue = initiativeOrder[currentTurnIndex].initiative;
        const fragment = document.createDocumentFragment();

        initiativeOrder.forEach((player, index) => {
            const card = document.createElement('div');
            card.classList.add('card');
            if (player.initiative === currentInitiativeValue) {
                card.classList.add('highlight');
            }
            card.innerHTML = `
                <div class="player-name">${player.name}</div>
                <span>${player.initiative}</span>
            `;
            fragment.appendChild(card);
        });

        initiativeOrderContainer.appendChild(fragment);

        // Add animation class to make cards appear smoothly
        setTimeout(() => {
            initiativeOrderContainer.classList.add('loaded');
        }, 50);
    }

    // Function to sort players by initiative
    function sortPlayersByInitiative() {
        initiativeOrder.sort((a, b) => b.initiative - a.initiative);
    }

    // Start round: Calculate and display the initiative order
    startRoundBtn.addEventListener('click', function (event) {
        event.preventDefault();

        // Validate initiative entries
        if (!validateInitiativeEntries()) {
            return; // Stop if any entries are invalid
        }

        initiativeOrder = [];
        [...initiativeEntries.children].forEach(entry => {
            const playerName = entry.querySelector('label').textContent.trim();
            const initiativeValue = parseInt(entry.querySelector('input').value, 10);
            initiativeOrder.push({ name: playerName, initiative: initiativeValue });
        });

        sortPlayersByInitiative();
        currentTurnIndex = 0;
        displayPlayerCards();

        // Show navigation buttons after starting the round
        prevTurnBtn.style.display = 'inline-block';
        nextTurnBtn.style.display = 'inline-block';
    });

    // Move to the next player's turn, skipping over cards with the same initiative value
    nextTurnBtn.addEventListener('click', function () {
        const currentInitiativeValue = initiativeOrder[currentTurnIndex].initiative;
        do {
            currentTurnIndex++;
            if (currentTurnIndex >= initiativeOrder.length) {
                currentTurnIndex = 0; // Loop back to the first player
                break;
            }
        } while (initiativeOrder[currentTurnIndex].initiative === currentInitiativeValue);

        displayPlayerCards();
    });

    // Move to the previous player's turn, skipping over cards with the same initiative value
    prevTurnBtn.addEventListener('click', function () {
        const currentInitiativeValue = initiativeOrder[currentTurnIndex].initiative;
        do {
            currentTurnIndex--;
            if (currentTurnIndex < 0) {
                currentTurnIndex = initiativeOrder.length - 1; // Loop back to the last player
                break;
            }
        } while (initiativeOrder[currentTurnIndex].initiative === currentInitiativeValue);

        displayPlayerCards();
    });

    // Load saved players on page load
    loadSavedPlayers();

    // Initial update of initiative rolls based on current session players
    updateInitiativeEntries();
});

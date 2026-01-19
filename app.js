class GameState {
    constructor() {
        this.players = [];
        this.selectedPacks = [];
        this.customPairs = [];
        this.currentRound = 0;
        this.currentPair = null;
        this.revealedPlayers = {};
        this.votes = {};
        this.allPairs = [];
        this.load();
    }

    save() {
        const state = {
            players: this.players,
            selectedPacks: this.selectedPacks,
            customPairs: this.customPairs,
            currentRound: this.currentRound,
            currentPair: this.currentPair,
            revealedPlayers: this.revealedPlayers,
            votes: this.votes,
            allPairs: this.allPairs
        };
        localStorage.setItem('undercoverState', JSON.stringify(state));
    }

    load() {
        const saved = localStorage.getItem('undercoverState');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                this.players = state.players || [];
                this.selectedPacks = state.selectedPacks || [];
                this.customPairs = state.customPairs || [];
                this.currentRound = state.currentRound || 0;
                this.currentPair = state.currentPair || null;
                this.revealedPlayers = state.revealedPlayers || {};
                this.votes = state.votes || {};
                this.allPairs = state.allPairs || [];
            } catch (e) {
                console.error('Error loading state:', e);
                this.reset();
            }
        }
    }

    reset() {
        this.players = [];
        this.selectedPacks = [];
        this.customPairs = [];
        this.currentRound = 0;
        this.currentPair = null;
        this.revealedPlayers = {};
        this.votes = {};
        this.allPairs = [];
        localStorage.removeItem('undercoverState');
    }

    startGame(players, selectedPacks, customPairs) {
        this.reset();
        this.players = players.map(name => ({ name, id: Math.random().toString() }));
        this.selectedPacks = selectedPacks;
        this.customPairs = customPairs;
        
        // Build all pairs
        this.allPairs = [];
        selectedPacks.forEach(packKey => {
            if (GAME_PACKS[packKey]) {
                this.allPairs.push(...GAME_PACKS[packKey].pairs);
            }
        });
        if (customPairs && customPairs.length > 0) {
            this.allPairs.push(...customPairs);
        }

        this.startRound();
        this.save();
    }

    startRound() {
        if (this.allPairs.length === 0) {
            this.allPairs.push({ word: 'Par défaut', undercover: 'Pair' });
        }
        this.currentPair = this.allPairs[Math.floor(Math.random() * this.allPairs.length)];
        this.revealedPlayers = {};
        this.votes = {};
        this.save();
    }

    getPlayerWord(playerId) {
        if (this.currentPair) {
            const undercover = this.getUndercoverPlayer();
            const isUndercover = undercover === playerId;
            return isUndercover ? this.currentPair.undercover : this.currentPair.word;
        }
        return '';
    }

    getUndercoverPlayer() {
        if (!this.currentPair || this.players.length === 0) return null;
        const hash = this.currentPair.word.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        return this.players[Math.abs(hash) % this.players.length].id;
    }

    revealPlayer(playerId) {
        this.revealedPlayers[playerId] = true;
        this.save();
    }

    allPlayersRevealed() {
        return this.players.every(p => this.revealedPlayers[p.id]);
    }

    vote(targetId) {
        this.votes[targetId] = (this.votes[targetId] || 0) + 1;
        this.save();
    }

    getMostVoted() {
        let maxVotes = 0;
        let mostVoted = null;
        for (const [playerId, votes] of Object.entries(this.votes)) {
            if (votes > maxVotes) {
                maxVotes = votes;
                mostVoted = playerId;
            }
        }
        return mostVoted;
    }

    getUndercoverWord() {
        return this.currentPair ? this.currentPair.undercover : '';
    }

    getNormalWord() {
        return this.currentPair ? this.currentPair.word : '';
    }

    nextRound() {
        this.currentRound++;
        this.startRound();
    }
}

class App {
    constructor() {
        this.state = new GameState();
        this.currentScreen = this.state.players.length > 0 ? 'game' : 'menu';
        this.render();
        this.setupEventListeners();
    }

    render() {
        const app = document.getElementById('app');
        app.innerHTML = '';

        if (this.currentScreen === 'menu') {
            app.appendChild(this.renderMenu());
        } else if (this.currentScreen === 'game') {
            app.appendChild(this.renderGame());
        } else if (this.currentScreen === 'waiting') {
            app.appendChild(this.renderWaiting());
        } else if (this.currentScreen === 'voting') {
            app.appendChild(this.renderVoting());
        } else if (this.currentScreen === 'result') {
            app.appendChild(this.renderResult());
        }

        // Info modal
        app.appendChild(this.renderInfoModal());
    }

    renderMenu() {
        const div = document.createElement('div');
        div.className = 'screen active';
        
        div.innerHTML = `
            <div class="menu-screen">
                <h1>Undercover</h1>
                
                <div class="menu-section">
                    <h2>Participants</h2>
                    <div class="players-container" id="playersContainer"></div>
                    <button class="btn-add-player" id="btnAddPlayer">Ajouter un participant</button>
                </div>

                <div class="menu-section">
                    <h2>Thèmes</h2>
                    <div class="packs-container" id="packsContainer"></div>
                </div>

                <div class="menu-section">
                    <h2>Mots personnalisés</h2>
                    <div class="upload-section">
                        <div class="file-input-wrapper">
                            <input type="file" id="csvInput" accept=".csv" />
                            <button class="btn-upload" id="btnUpload">Charger CSV</button>
                        </div>
                        <div class="upload-info">
                            Format CSV: mot,undercover (une paire par ligne)
                        </div>
                    </div>
                </div>

                <div class="menu-buttons">
                    <button class="btn-info" id="btnInfo">Règles</button>
                    <button class="btn-primary" id="btnStartGame" disabled>Commencer</button>
                </div>
            </div>
        `;

        // Render players
        const playersContainer = div.querySelector('#playersContainer');
        if (this.state.players.length === 0) {
            this.addPlayerInput(playersContainer);
        } else {
            this.state.players.forEach((player, idx) => {
                playersContainer.appendChild(this.createPlayerInput(player.name, idx));
            });
        }

        // Render packs
        const packsContainer = div.querySelector('#packsContainer');
        Object.entries(GAME_PACKS).forEach(([key, pack]) => {
            const label = document.createElement('label');
            label.className = 'pack-checkbox';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.value = key;
            input.checked = this.state.selectedPacks.includes(key);
            label.appendChild(input);
            label.appendChild(document.createTextNode(pack.name));
            packsContainer.appendChild(label);
        });

        // Event listeners
        div.querySelector('#btnAddPlayer').addEventListener('click', () => {
            this.addPlayerInput(playersContainer);
        });

        div.querySelector('#btnUpload').addEventListener('click', () => {
            div.querySelector('#csvInput').click();
        });

        div.querySelector('#csvInput').addEventListener('change', (e) => {
            this.handleCSVUpload(e, div);
        });

        div.querySelector('#btnStartGame').addEventListener('click', () => {
            this.startGame();
        });

        div.querySelector('#btnInfo').addEventListener('click', () => {
            this.showInfo();
        });

        this.updateMenuValidation(div);

        return div;
    }

    addPlayerInput(container) {
        container.appendChild(this.createPlayerInput('', container.children.length));
    }

    createPlayerInput(name, index) {
        const group = document.createElement('div');
        group.className = 'player-input-group';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `Joueur ${index + 1}`;
        input.value = name;
        
        const btnRemove = document.createElement('button');
        btnRemove.className = 'btn-remove';
        btnRemove.textContent = '✕';
        btnRemove.addEventListener('click', () => {
            group.remove();
            this.updateMenuValidation();
        });

        input.addEventListener('input', () => {
            this.updateMenuValidation();
        });

        group.appendChild(input);
        group.appendChild(btnRemove);
        return group;
    }

    handleCSVUpload(e, menuDiv) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const csv = event.target.result;
                const lines = csv.trim().split('\n');
                const pairs = [];

                lines.forEach(line => {
                    const [word, undercover] = line.split(',').map(s => s.trim());
                    if (word && undercover) {
                        pairs.push({ word, undercover });
                    }
                });

                if (pairs.length > 0) {
                    this.state.customPairs = pairs;
                    this.state.save();
                    
                    // Show success message
                    const container = menuDiv.querySelector('.menu-section:has(.upload-section)');
                    let msg = container.querySelector('.success-message');
                    if (msg) msg.remove();
                    
                    msg = document.createElement('div');
                    msg.className = 'success-message';
                    msg.textContent = `✓ ${pairs.length} paires chargées`;
                    container.appendChild(msg);
                    
                    setTimeout(() => msg.remove(), 3000);
                } else {
                    this.showError(menuDiv, 'Format CSV invalide');
                }
            } catch (err) {
                this.showError(menuDiv, 'Erreur lors du chargement du fichier');
            }
        };
        reader.readAsText(file);
    }

    updateMenuValidation(menuDiv = null) {
        if (!menuDiv) {
            const app = document.getElementById('app');
            menuDiv = app.querySelector('.menu-screen');
        }

        const inputs = menuDiv.querySelectorAll('.player-input-group input');
        const players = Array.from(inputs).map(i => i.value.trim()).filter(v => v);
        const packs = Array.from(menuDiv.querySelectorAll('.pack-checkbox input:checked')).map(i => i.value);

        const btn = menuDiv.querySelector('#btnStartGame');
        const hasPlayers = players.length >= 2;
        const hasPacks = packs.length > 0 || this.state.customPairs.length > 0;

        btn.disabled = !hasPlayers || !hasPacks;

        // Save state temporarily
        this.state.players = players.map(name => ({ name, id: Math.random().toString() }));
        this.state.selectedPacks = packs;
        this.state.save();
    }

    startGame() {
        const menuDiv = document.querySelector('.menu-screen');
        const inputs = menuDiv.querySelectorAll('.player-input-group input');
        const players = Array.from(inputs).map(i => i.value.trim()).filter(v => v);
        const packs = Array.from(menuDiv.querySelectorAll('.pack-checkbox input:checked')).map(i => i.value);

        if (players.length < 2) {
            this.showError(menuDiv, 'Au moins 2 joueurs requis');
            return;
        }

        if (packs.length === 0 && this.state.customPairs.length === 0) {
            this.showError(menuDiv, 'Sélectionnez au moins un pack');
            return;
        }

        this.state.startGame(players, packs, this.state.customPairs);
        this.currentScreen = 'game';
        this.render();
    }

    renderGame() {
        const div = document.createElement('div');
        div.className = 'screen active game-screen';

        div.innerHTML = `
            <div class="game-header">
                <div class="round-info">Manche ${this.state.currentRound + 1}</div>
                <button class="btn-quit" id="btnQuit">Arrêter</button>
            </div>
            <div class="players-grid" id="playersGrid"></div>
        `;

        const grid = div.querySelector('#playersGrid');
        this.state.players.forEach(player => {
            const card = document.createElement('div');
            card.className = 'player-card';
            if (this.state.revealedPlayers[player.id]) {
                card.classList.add('revealed');
                card.innerHTML = `
                    <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                        <span class="reveal-badge"></span>
                        <span>${player.name}</span>
                    </div>
                `;
            } else {
                card.textContent = player.name;
            }

            card.addEventListener('click', () => {
                if (!this.state.revealedPlayers[player.id]) {
                    this.showWordModal(player, div);
                }
            });

            grid.appendChild(card);
        });

        div.querySelector('#btnQuit').addEventListener('click', () => {
            if (confirm('Quitter la partie ? Vous pouvez reprendre plus tard.')) {
                this.currentScreen = 'menu';
                this.render();
            }
        });

        return div;
    }

    showWordModal(player, gameScreen) {
        const modal = document.createElement('div');
        modal.className = 'modal active';

        const word = this.state.getPlayerWord(player.id);
        const isUndercover = this.state.getUndercoverPlayer() === player.id;

        modal.innerHTML = `
            <div class="modal-content">
                <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 10px;">
                    ${player.name}
                </div>
                <div class="modal-word">${word}</div>
                <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 20px;">
                    ${isUndercover ? 'Tu es undercover' : ''}
                </div>
                <div class="modal-buttons">
                    <button class="btn-confirm" id="btnConfirm">Confirmer</button>
                </div>
            </div>
        `;

        gameScreen.appendChild(modal);

        modal.querySelector('#btnConfirm').addEventListener('click', () => {
            this.state.revealPlayer(player.id);
            modal.remove();

            // Update UI
            const playerCard = gameScreen.querySelector(`.player-card:nth-child(${this.state.players.indexOf(player) + 1})`);
            playerCard.classList.add('revealed');
            playerCard.textContent = player.name;
            playerCard.style.opacity = '0.6';

            if (this.state.allPlayersRevealed()) {
                setTimeout(() => {
                    this.currentScreen = 'waiting';
                    this.render();
                }, 500);
            }
        });
    }

    renderWaiting() {
        const div = document.createElement('div');
        div.className = 'screen active waiting-screen';

        div.innerHTML = `
            <div class="waiting-content">
                <div style="display: flex; align-items: center; gap: 10px; justify-content: center;">
                    <button class="btn-quit" id="btnQuit" style="flex: none;">Arrêter</button>
                </div>
                <h2>Prêt pour le vote</h2>
                <div class="players-revealed" id="playersRevealed"></div>
                <button class="btn-start-vote" id="btnStartVote">Passer au vote</button>
            </div>
        `;

        const revealed = div.querySelector('#playersRevealed');
        this.state.players.forEach(player => {
            const badge = document.createElement('div');
            badge.className = 'player-revealed-badge ready';
            badge.textContent = player.name;
            revealed.appendChild(badge);
        });

        div.querySelector('#btnStartVote').addEventListener('click', () => {
            this.currentScreen = 'voting';
            this.render();
        });

        div.querySelector('#btnQuit').addEventListener('click', () => {
            if (confirm('Arrêter la partie et revenir au menu ?')) {
                this.state.reset();
                this.currentScreen = 'menu';
                this.render();
            }
        });

        return div;
    }

    renderVoting() {
        const div = document.createElement('div');
        div.className = 'screen active voting-screen';

        let selectedPlayer = null;

        div.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                <div class="voting-title">Qui est undercover ?</div>
                <button class="btn-quit" id="btnQuit">Quitter</button>
            </div>
            <div class="voting-grid" id="votingGrid"></div>
            <div class="voting-buttons">
                <button class="btn-confirm-vote" id="btnConfirmVote" disabled>Confirmer le vote</button>
            </div>
        `;

        const grid = div.querySelector('#votingGrid');
        const btnVote = div.querySelector('#btnConfirmVote');

        this.state.players.forEach(player => {
            const card = document.createElement('div');
            card.className = 'voting-card';
            card.innerHTML = `
                <div class="voting-name">${player.name}</div>
                <div class="voting-votes" id="votes-${player.id}">0</div>
            `;

            card.addEventListener('click', () => {
                document.querySelectorAll('.voting-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedPlayer = player;
                btnVote.disabled = false;
            });

            grid.appendChild(card);
        });

        btnVote.addEventListener('click', () => {
            if (selectedPlayer) {
                const isCorrect = selectedPlayer.id === this.state.getUndercoverPlayer();
                this.state.votes[selectedPlayer.id] = this.state.votes[selectedPlayer.id] || 0;
                this.currentScreen = 'result';
                this.resultData = {
                    selectedId: selectedPlayer.id,
                    isCorrect: isCorrect
                };
                this.render();
            }
        });

        div.querySelector('#btnQuit').addEventListener('click', () => {
            if (confirm('Arrêter la partie ?')) {
                this.state.reset();
                this.currentScreen = 'menu';
                this.render();
            }
        });

        return div;
    }

    renderResult() {
        const div = document.createElement('div');
        div.className = 'screen active result-screen';

        const selectedId = this.resultData.selectedId;
        const isCorrect = this.resultData.isCorrect;
        const selectedPlayer = this.state.players.find(p => p.id === selectedId);
        const undercover = this.state.players.find(p => p.id === this.state.getUndercoverPlayer());

        const title = isCorrect ? 'Trouvé' : 'Raté';
        const titleClass = isCorrect ? 'result-correct' : 'result-incorrect';

        div.innerHTML = `
            <div class="result-content">
                <button class="btn-quit" id="btnQuit" style="align-self: flex-end;">Quitter</button>
                <div class="result-title ${titleClass}">${title}</div>
                ${isCorrect ? `
                    <div class="result-undercover">${selectedPlayer.name} avait le mot différent</div>
                    <div class="result-word-container result-correct-word">
                        <div class="word-label">Mot normal</div>
                        <div class="result-word">${this.state.getNormalWord()}</div>
                        <div class="word-label">Mot undercover</div>
                        <div class="result-word">${this.state.getUndercoverWord()}</div>
                    </div>
                ` : `
                    <div class="result-undercover">Le mot différent était celui de ${undercover.name}</div>
                    <div class="result-word-container result-incorrect-word">
                        <div class="word-label">Mot normal</div>
                        <div class="result-word">${this.state.getNormalWord()}</div>
                        <div class="word-label">Mot undercover</div>
                        <div class="result-word">${this.state.getUndercoverWord()}</div>
                    </div>
                `}
                <button class="btn-next-round" id="btnNextRound">Manche suivante →</button>
            </div>
        `;

        div.querySelector('#btnNextRound').addEventListener('click', () => {
            this.state.nextRound();
            this.currentScreen = 'game';
            this.render();
        });

        div.querySelector('#btnQuit').addEventListener('click', () => {
            if (confirm('Quitter la partie ?')) {
                this.state.reset();
                this.currentScreen = 'menu';
                this.render();
            }
        });

        return div;
    }

    renderInfoModal() {
        const div = document.createElement('div');
        div.id = 'infoModal';
        div.className = 'info-modal';

        div.innerHTML = `
            <div class="info-content">
                <h1>Undercover</h1>
                
                <h2>Règles</h2>
                <p>Un jeu de déduction pour 2 joueurs ou plus.</p>

                <h2>Fonctionnement</h2>
                <ol>
                    <li>Chaque participant reçoit un mot caché du regard des autres</li>
                    <li>Un participant reçoit un mot légèrement différent</li>
                    <li>À tour de rôle, chacun donne un indice en relation avec son mot</li>
                    <li>Après les tours de parole, on vote pour éliminer celui avec le mot différent</li>
                    <li>Découvrez si vous aviez raison</li>
                </ol>

                <h2>Stratégie</h2>
                <p>Avec le mot différent, sois discret. Utilise des indices qui pourraient correspondre aux deux mots. Les autres doivent identifier qui a reçu un mot différent.</p>

                <h2>Importer des mots personnalisés</h2>
                <p>Crée un fichier CSV avec tes propres paires:</p>
                <code style="display: block; background: var(--bg); padding: 10px; margin: 10px 0;">
mot,undercover<br/>
Cuisine,Gastronomie<br/>
Cinéma,Film
                </code>
                <p>Format: <code>mot_normal,mot_différent</code> (une paire par ligne)</p>

                <h2>Sauvegarde</h2>
                <p>La partie est sauvegardée automatiquement. Si le navigateur se ferme, tu pourras reprendre où tu t'étais arrêté.</p>

                <div class="info-buttons">
                    <button class="btn-close-info" id="btnCloseInfo">Fermer</button>
                </div>
            </div>
        `;

        div.addEventListener('click', (e) => {
            if (e.target === div) {
                this.hideInfo();
            }
        });

        div.querySelector('#btnCloseInfo').addEventListener('click', () => {
            this.hideInfo();
        });

        return div;
    }

    showInfo() {
        document.getElementById('infoModal').classList.add('active');
    }

    hideInfo() {
        document.getElementById('infoModal').classList.remove('active');
    }

    showError(container, message) {
        let msg = container.querySelector('.error-message');
        if (msg) msg.remove();
        
        msg = document.createElement('div');
        msg.className = 'error-message';
        msg.textContent = '⚠️ ' + message;
        container.appendChild(msg);
        
        setTimeout(() => msg.remove(), 3000);
    }

    setupEventListeners() {
        // Prevent scrolling
        document.addEventListener('touchmove', (e) => {
            if (
                e.target.closest('.players-grid') ||
                e.target.closest('.voting-grid') ||
                e.target.closest('.menu-screen') ||
                e.target.closest('.info-content') ||
                e.target.closest('.modal-content')
            ) {
                return; // Allow scroll in specific containers
            }
            e.preventDefault();
        }, { passive: false });
    }
}

// Initialize app
window.addEventListener('DOMContentLoaded', () => {
    new App();
});

// Prevent zoom
document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
});

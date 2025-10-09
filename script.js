document.addEventListener('DOMContentLoaded', () => {
    const CARDS = {
        ROCK: { name: 'グー', img: 'images/rock.jpg' },
        SCISSORS: { name: 'チョキ', img: 'images/scissors.jpg' },
        PAPER: { name: 'パー', img: 'images/paper.jpg' },
        JOKER: { name: 'ジョーカー', img: 'images/joker.jpg' }
    };
    const CARD_BACK = 'images/card_back.png';
    const EXPRESSIONS = {
        angry: 'images/master_angry.png',
        confused: 'images/master_confused.png',
        happy: 'images/master_happy.png',
        worried: 'images/master_worried.png'
    };

    const elements = {
        playerScore: document.getElementById('player-score'),
        masterScore: document.getElementById('master-score'),
        playerDeckCount: document.getElementById('player-deck-count'),
        masterDeckCount: document.getElementById('master-deck-count'),
        masterHandCount: document.getElementById('master-hand-count'),
        playerHand: document.getElementById('player-hand'),
        masterExpression: document.getElementById('master-expression'),
        playerPlayedCardImg: document.getElementById('player-played-card-img'),
        masterPlayedCardImg: document.getElementById('master-played-card-img'),
        playerJokerStatus: document.getElementById('player-joker-status'),
        masterJokerStatus: document.getElementById('master-joker-status'),
        playerActiveJokerDisplay: document.getElementById('player-active-joker-display'),
        masterActiveJokerDisplay: document.getElementById('master-active-joker-display'),
        message: document.getElementById('message'),
        turnCounter: document.getElementById('turn-counter'),
        suddenDeathOverlay: document.getElementById('sudden-death-overlay'),
        suddenDeathCards: document.getElementById('sudden-death-cards'),
        gameOverOverlay: document.getElementById('game-over-overlay'),
        gameOverTitle: document.getElementById('game-over-title'),
        gameOverMessage: document.getElementById('game-over-message'),
        restartButton: document.getElementById('restart-button'),
        bgm: document.getElementById('bgm'),
        discardPileOverlay: document.getElementById('discard-pile-overlay'),
        playerDiscardArea: document.getElementById('player-discard-area'),
        masterDiscardArea: document.getElementById('master-discard-area'),
        playerDiscardCount: document.getElementById('player-discard-count'),
        masterDiscardCount: document.getElementById('master-discard-count'),
        closeDiscardButton: document.getElementById('close-discard-button'),
        redrawButton: document.getElementById('redraw-button')
    };

    let state = {};
    let isMusicPlaying = false;

    function playMusic() {
        if (!isMusicPlaying) {
            elements.bgm.volume = 0.5;
            elements.bgm.play().catch(error => console.log("BGMの自動再生がブラウザにブロックされました。"));
            isMusicPlaying = true;
        }
    }

    function createDeck() {
        const deck = [];
        for (let i = 0; i < 5; i++) {
            deck.push(CARDS.ROCK, CARDS.SCISSORS, CARDS.PAPER);
        }
        deck.push(CARDS.JOKER);
        return deck;
    }

    function shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }
    
    function initGame() {
        state = {
            playerDeck: createDeck(),
            masterDeck: createDeck(),
            playerHand: [],
            masterHand: [],
            playerDiscard: [],
            masterDiscard: [],
            playerScore: 0,
            masterScore: 0,
            turn: 1,
            playerJokerActive: false,
            masterJokerActive: false,
            playerActiveJokerCard: null,
            masterActiveJokerCard: null,
            playerPlayedCard: null,
            masterPlayedCard: null,
            redrawUsed: false,
            isPlayerTurn: true,
            isGameOver: false
        };
        
        shuffleDeck(state.playerDeck);
        shuffleDeck(state.masterDeck);

        for (let i = 0; i < 3; i++) {
            drawCard('player');
            drawCard('master');
        }
        
        elements.playerJokerStatus.style.display = 'none';
        elements.masterJokerStatus.style.display = 'none';
        elements.playerActiveJokerDisplay.classList.add('hidden');
        elements.masterActiveJokerDisplay.classList.add('hidden');
        elements.discardPileOverlay.classList.add('hidden');
        elements.suddenDeathOverlay.classList.add('hidden');
        elements.gameOverOverlay.classList.add('hidden');
        elements.playerPlayedCardImg.src = CARD_BACK;
        elements.masterPlayedCardImg.src = CARD_BACK;
        elements.redrawButton.disabled = false;
        elements.redrawButton.textContent = '手札引き直し (1回)';
       
        
        updateUI();
    }

    function drawCard(target) {
        const deck = state[`${target}Deck`];
        const hand = state[`${target}Hand`];
        if (deck.length > 0) {
            hand.push(deck.pop());
        }
    }

    function updateUI() {
        elements.playerScore.textContent = state.playerScore;
        elements.masterScore.textContent = state.masterScore;
        elements.playerDeckCount.textContent = state.playerDeck.length;
        elements.masterDeckCount.textContent = state.masterDeck.length;
        elements.masterHandCount.textContent = state.masterHand.length;
        elements.turnCounter.textContent = `ターン: ${state.turn}`;
        const canRedraw = !state.redrawUsed && state.isPlayerTurn && state.playerDeck.length >= state.playerHand.length;
        elements.redrawButton.disabled = !canRedraw;

        elements.playerHand.innerHTML = '';
        state.playerHand.forEach((card, index) => {
            const cardEl = document.createElement('img');
            cardEl.src = card.img;
            cardEl.alt = card.name;
            cardEl.classList.add('card');
            cardEl.dataset.index = index;
            if (state.isPlayerTurn) {
                cardEl.addEventListener('click', handlePlayerPlay);
            }
            elements.playerHand.appendChild(cardEl);
        });
        
        updateMasterExpression();
    }

    function updateMasterExpression() {
        const scoreDiff = state.masterScore - state.playerScore;
        if (scoreDiff >= 3) {
            elements.masterExpression.src = EXPRESSIONS.happy;
        } else if (scoreDiff <= -3) {
            elements.masterExpression.src = EXPRESSIONS.worried;
        } else {
            elements.masterExpression.src = EXPRESSIONS.angry;
        }
    }

    function handlePlayerPlay(event) {
       // playMusic();
        if (!state.isPlayerTurn) return;
        state.isPlayerTurn = false;

        const cardIndex = parseInt(event.target.dataset.index);
        state.playerPlayedCard = state.playerHand.splice(cardIndex, 1)[0];
        
        elements.playerPlayedCardImg.src = state.playerPlayedCard.img;
        elements.message.textContent = 'マスターがカードを選んでいます...';
        updateUI();

        setTimeout(masterTurn, 1000);
    }

    function masterTurn() {
        let cardIndex = -1;
        if (state.turn >= 6 && !state.playerJokerActive) {
            cardIndex = state.masterHand.findIndex(card => card.name === CARDS.JOKER.name);
        }

        if (cardIndex === -1) {
            cardIndex = Math.floor(Math.random() * state.masterHand.length);
        }
        
        state.masterPlayedCard = state.masterHand.splice(cardIndex, 1)[0];
        elements.masterPlayedCardImg.src = state.masterPlayedCard.img;

        setTimeout(resolveTurn, 1000);
    }

    function resolveTurn() {
        const pCard = state.playerPlayedCard;
        const mCard = state.masterPlayedCard;
        let resultMessage = '';
        let turnWinner = null;

        if (pCard.name === CARDS.JOKER.name && mCard.name === CARDS.JOKER.name) {
            resultMessage = '両者ジョーカー！カードは捨てられます。';
            state.playerDiscard.push(pCard);
            state.masterDiscard.push(mCard);
            turnWinner = 'draw';
        } else if (pCard.name === CARDS.JOKER.name) {
            resultMessage = 'ジョーカー！あなたの勝ち！';
            state.playerJokerActive = true;
            state.playerActiveJokerCard = pCard;
            state.masterDiscard.push(mCard);
            elements.playerJokerStatus.style.display = 'block';
            elements.playerJokerStatus.textContent = 'JOKER';
            elements.masterExpression.src = EXPRESSIONS.confused;
            turnWinner = 'player';
        } else if (mCard.name === CARDS.JOKER.name) {
            resultMessage = 'マスターがジョーカー！あなたの負け！';
            state.masterJokerActive = true;
            state.masterActiveJokerCard = mCard;
            state.playerDiscard.push(pCard);
            elements.masterJokerStatus.style.display = 'block';
            elements.masterJokerStatus.textContent = 'JOKER';
            turnWinner = 'master';
        } else {
            state.playerDiscard.push(pCard);
            state.masterDiscard.push(mCard);
            if (pCard.name === mCard.name) {
                resultMessage = 'あいこ！';
                turnWinner = 'draw';
            } else if (
                (pCard.name === CARDS.ROCK.name && mCard.name === CARDS.SCISSORS.name) ||
                (pCard.name === CARDS.SCISSORS.name && mCard.name === CARDS.PAPER.name) ||
                (pCard.name === CARDS.PAPER.name && mCard.name === CARDS.ROCK.name)
            ) {
                resultMessage = `${pCard.name}であなたの勝ち！`;
                turnWinner = 'player';
            } else {
                resultMessage = `${mCard.name}であなたの負け！`;
                turnWinner = 'master';
            }
        }
        
        if (turnWinner === 'player') {
            state.playerScore++;
            if(state.masterJokerActive) {
                resultMessage += ' マスターのジョーカーを無効化した！';
                state.masterDiscard.push(state.masterActiveJokerCard);
                state.masterJokerActive = false;
                state.masterActiveJokerCard = null;
                elements.masterJokerStatus.style.display = 'none';
            }
        } else if (turnWinner === 'master') {
            state.masterScore++;
             if(state.playerJokerActive) {
                resultMessage += ' あなたのジョーカーが無効化された！';
                state.playerDiscard.push(state.playerActiveJokerCard);
                state.playerJokerActive = false;
                state.playerActiveJokerCard = null;
                elements.playerJokerStatus.style.display = 'none';
            }
        } else {
            if (state.playerJokerActive) { state.playerScore++; resultMessage += ' (J効果+1)'; }
            if (state.masterJokerActive) { state.masterScore++; resultMessage += ' (J効果+1)'; }
        }
        
        elements.message.textContent = resultMessage;
        updateActiveJokerDisplay();
        setTimeout(endTurn, 2500);
    }

    function updateActiveJokerDisplay() {
        if(state.playerJokerActive) {
            elements.playerActiveJokerDisplay.innerHTML = `<img src="${CARDS.JOKER.img}" alt="Joker">`;
            elements.playerActiveJokerDisplay.classList.remove('hidden');
        } else {
            elements.playerActiveJokerDisplay.classList.add('hidden');
        }

        if(state.masterJokerActive) {
            elements.masterActiveJokerDisplay.innerHTML = `<img src="${CARDS.JOKER.img}" alt="Joker">`;
            elements.masterActiveJokerDisplay.classList.remove('hidden');
        } else {
            elements.masterActiveJokerDisplay.classList.add('hidden');
        }
    }
    
    function endTurn() {
        elements.playerPlayedCardImg.src = CARD_BACK;
        elements.masterPlayedCardImg.src = CARD_BACK;

        if (state.playerHand.length === 0 && state.playerDeck.length === 0) {
            state.isGameOver = true;
            if (state.playerScore === state.masterScore) {
                startSuddenDeath();
            } else {
                showGameOver();
            }
            return;
        }

        drawCard('player');
        drawCard('master');
        state.turn++;
        state.isPlayerTurn = true;
        
        elements.message.textContent = '手札からカードを選んでください';
        updateUI();
    }
    
    function showDiscardPile() {
        elements.playerDiscardCount.textContent = state.playerDiscard.length;
        elements.masterDiscardCount.textContent = state.masterDiscard.length;

        elements.playerDiscardArea.innerHTML = '';
        state.playerDiscard.forEach(card => {
            const cardEl = document.createElement('img');
            cardEl.src = card.img;
            elements.playerDiscardArea.appendChild(cardEl);
        });

        elements.masterDiscardArea.innerHTML = '';
        state.masterDiscard.forEach(card => {
            const cardEl = document.createElement('img');
            cardEl.src = card.img;
            elements.masterDiscardArea.appendChild(cardEl);
        });

        elements.discardPileOverlay.classList.remove('hidden');
    }

    function hideDiscardPile() {
        elements.discardPileOverlay.classList.add('hidden');
    }

    function startSuddenDeath() {
        elements.suddenDeathOverlay.classList.remove('hidden');
        elements.suddenDeathCards.innerHTML = '';
        const sdCards = [CARDS.ROCK, CARDS.SCISSORS, CARDS.PAPER];
        shuffleDeck(sdCards);
        
        sdCards.forEach(card => {
            const cardEl = document.createElement('img');
            cardEl.src = CARD_BACK;
            cardEl.dataset.cardName = card.name;
            cardEl.dataset.cardImg = card.img;
            cardEl.addEventListener('click', resolveSuddenDeath);
            elements.suddenDeathCards.appendChild(cardEl);
        });
    }

   function handleRedraw() {
        if (state.redrawUsed || !state.isPlayerTurn || state.playerDeck.length < state.playerHand.length) {
            return; // 条件を満たさない場合は何もしない
        }
        
        state.redrawUsed = true;
        const handSize = state.playerHand.length;

        // 手札を山札に戻す
        state.playerDeck.push(...state.playerHand);
        state.playerHand = [];

        // 山札をシャッフル
        shuffleDeck(state.playerDeck);

        // 新しい手札を引く
        for (let i = 0; i < handSize; i++) {
            if (state.playerDeck.length > 0) {
                drawCard('player');
            }
        }
        
        elements.redrawButton.textContent = '引き直し済み';
        updateUI(); // UIを更新して新しい手札とボタンの状態を反映
    }

    function resolveSuddenDeath(event) {
        const playerChoice = event.target;
        const remainingCards = Array.from(elements.suddenDeathCards.children).filter(c => c !== playerChoice);
        const masterChoice = remainingCards[Math.floor(Math.random() * remainingCards.length)];

        playerChoice.src = playerChoice.dataset.cardImg;
        masterChoice.src = masterChoice.dataset.cardImg;
        
        Array.from(elements.suddenDeathCards.children).forEach(c => c.removeEventListener('click', resolveSuddenDeath));

        const pCardName = playerChoice.dataset.cardName;
        const mCardName = masterChoice.dataset.cardName;

        let playerWins = false;
        if (pCardName !== mCardName) {
             if (
                (pCardName === CARDS.ROCK.name && mCardName === CARDS.SCISSORS.name) ||
                (pCardName === CARDS.SCISSORS.name && mCardName === CARDS.PAPER.name) ||
                (pCardName === CARDS.PAPER.name && mCardName === CARDS.ROCK.name)
            ) {
                playerWins = true;
            }
        } else {
             setTimeout(startSuddenDeath, 2000);
             return;
        }

        if (playerWins) { state.playerScore++; } else { state.masterScore++; }
        setTimeout(showGameOver, 2000);
    }

    function showGameOver() {
        elements.suddenDeathOverlay.classList.add('hidden');
        elements.gameOverOverlay.classList.remove('hidden');

        if (state.playerScore > state.masterScore) {
            elements.gameOverTitle.textContent = '勝利！';
            elements.gameOverMessage.textContent = '見事ジャンケンマスターを打ち破った！';
        } else {
            elements.gameOverTitle.textContent = '敗北...';
            elements.gameOverMessage.textContent = 'ジャンケンマスターの壁は厚かった...';
        }
    }
    
    elements.restartButton.addEventListener('click', initGame);
    document.body.addEventListener('click', playMusic, { once: true });
    document.querySelectorAll('.discard-pile-button').forEach(button => {
        button.addEventListener('click', showDiscardPile);
    });
    elements.closeDiscardButton.addEventListener('click', hideDiscardPile);
     elements.redrawButton.addEventListener('click', handleRedraw);

    initGame();
});
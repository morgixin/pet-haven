const playerAnimals = ["dog", "cat", "chicken", "sheep", "cow", "horse", "wolf"];

function randomFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getKeyString(x, y) {
    return `${x}x${y}`;
}

// gera um nome aleatorio para o jogador
function createName() {
    const prefix = randomFromArray([
        "COOL",
        "SUPER",
        "HIP",
        "SMUG",
        "SILKY",
        "GOOD",
        "SAFE",
        "DEAR",
        "DAMP",
        "WARM",
        "RICH",
        "LONG",
        "DARK",
        "SOFT",
        "BUFF",
        "DOPE",
    ]);
    const animal = randomFromArray([
        "DOG",
        "CAT",
        "LAMB",
        "HORSE",
        "COW",
        "WOLF",
    ]);
    return `${prefix} ${animal}`;
}

(function () {
    let playerId; 
    let playerRef; // ref do db
    let players = {}; // lista local de jogadores do game state, atualizado pelo db
    let playerElements = {}; // referencia aos elementos do DOM

    const gameContainer = document.querySelector(".game-container");

    function handleArrowPress(xChange, yChange) {
        const newX = players[playerId].x + xChange;
        const newY = players[playerId].y + yChange;

        if (true) {
            // permite se mover para outro espaço
            players[playerId].x = newX;
            players[playerId].y = newY;
            if (xChange === 1) 
                players[playerId].direction = "right";
            if (xChange === -1)
                players[playerId].direction = "left";
            playerRef.set(players[playerId]);
        }
    }

    function initGame() {
        new KeyPressListener("ArrowUp", () => handleArrowPress(0, -1));
        new KeyPressListener("ArrowDown", () => handleArrowPress(0, 1));
        new KeyPressListener("ArrowLeft", () => handleArrowPress(-1, 0));
        new KeyPressListener("ArrowRight", () => handleArrowPress(1, 0));

        const allPlayersRef = firebase.database().ref(`players`);
        
        allPlayersRef.on("value", (snapshot) => {
            // executa sempre que houver alguma mudanca no bd
            players = snapshot.val() || {};
            Object.keys(players).forEach((key) => {
                const characterState = players[key];
                let element = playerElements[key];

                // no futuro, implementar uma framework de JS para atualizar o dom
                element.querySelector(".Character_name").innerText = characterState.username;
                element.setAttribute("data-animal", characterState.animal);
                element.setAttribute("data-direction", characterState.direction);
                // atualiza a posicao dos jogadores
                const left = 16 * characterState.x + "px";
                const top = 16 * characterState.y + "px";
                element.style.transform = `translate3d(${left}, ${top}, 0)`;
            })

        })
        allPlayersRef.on("child_added", (snapshot) => {
            // executa sempre que um jogador novo entrar
            const addedPlayer = snapshot.val(); // retorna um objeto com todos os dados do jogador
            const characterElement = document.createElement("div");
            characterElement.classList.add("Character", "grid-cell");
            if (addedPlayer.id === playerId) {
                characterElement.classList.add("you");
            }
            characterElement.innerHTML = (`
                <div class="Character_shadow grid-cell"></div>
                <div class="Character_sprite grid-cell"></div>
                <div class="Character_name-container">
                    <span class="Character_name"></span>
                </div>
                <div class="Character_you-arrow"></div>
            `);
            playerElements[addedPlayer.id] = characterElement;

            // preenche os valores no html com os valores do bd
            characterElement.querySelector(".Character_name").innerText = addedPlayer.username;
            characterElement.setAttribute("data-animal", addedPlayer.animal);
            characterElement.setAttribute("data-direction", addedPlayer.direction);
            const left = 16 * addedPlayer.x + "px";
            const top = 16 * addedPlayer.y + "px";
            characterElement.style.transform = `translate3d(${left}, ${top}, 0)`;

            gameContainer.appendChild(characterElement);
        })
        allPlayersRef.on("child_removed", (snapshot) => {
            const removedKey = snapshot.val().id;
            gameContainer.removeChild(playerElements[removedKey]);
            delete playerElements[removedKey];
        })

    }

    firebase.auth().onAuthStateChanged((user) => {
        console.log(user);
        if (user) {
            playerId = user.uid;
            playerRef = firebase.database().ref(`players/${playerId}`);
            
            const username = createName();
            
            // cada vez que alguem carregar a pagina, um novo id sera criado no bd
            // contendo os dados passados
            playerRef.set({
                id: playerId,
                username,
                direction: "right",
                animal: randomFromArray(playerAnimals),
                //x: (Math.random() * (12 - 1) + 1),
                x: 3,
                y: 4,
            });

            // remove o jogador quando desconectar
            playerRef.onDisconnect().remove();

            // comeca o jogo depois de logar
            initGame();

        } else {
            // deslogado
        }

    })

    firebase.auth().signInAnonymously().catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;

        console.log(errorCode, errorMessage);
    });


})();
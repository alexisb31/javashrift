let selectedSkin = "johny.png";
let gameStarted = false;

document.querySelectorAll(".character").forEach(img => {
    img.addEventListener("click", () => {
        document.querySelectorAll(".character").forEach(c => c.classList.remove("selected"));
        img.classList.add("selected");
        selectedSkin = img.dataset.skin;
    });
});

document.getElementById("startGame").addEventListener("click", () => {
    document.getElementById("menu").style.display = "none";
    const playerElement = document.getElementById("player");
    playerElement.style.backgroundImage = `url('layouts/${selectedSkin}')`;
    gameStarted = true;
});

const player = document.querySelector("#player");
const game = document.querySelector("#game");
const livesContainer = document.getElementById("lives");
const scoreDisplay = document.getElementById("score");
const bestDisplay = document.getElementById("best");
const historyDisplay = document.getElementById("history");

let positionX = 50;
let positionY = 0;
let isJumping = false;
let isCrouching = false;
let gameOver = false;
let lives = 3;
let score = 0;
let moveLeft = false;
let moveRight = false;
const moveSpeed = 4;

let currentPlatform = null;

const jumpSound = new Audio("sounds/jump.mp3");
const landSound = new Audio("sounds/land.mp3");
const hitSound = new Audio("sounds/hit.mp3");
const scoreSound = new Audio("sounds/score.mp3");
const gameOverSound = new Audio("sounds/gameover.mp3");

let bestScore = localStorage.getItem("bestScore") || 0;
let scoreHistory = JSON.parse(localStorage.getItem("scoreHistory")) || [];
bestDisplay.innerText = bestScore;
updateHistory();

function updateLives() {
    livesContainer.innerHTML = "";
    for (let i = 0; i < lives; i++) {
        const heart = document.createElement("img");
        heart.src = "layouts/vitale_transparent.png";
        livesContainer.appendChild(heart);
    }
}

function updateScore() {
    scoreDisplay.innerText = score;
}

function updateHistory() {
    historyDisplay.innerText = scoreHistory.slice(-3).reverse().join(", ");
}

function gameLoop() {
    if (gameStarted && !gameOver) {
        if (moveLeft) positionX = Math.max(0, positionX - moveSpeed);
        if (moveRight) positionX = Math.min(530, positionX + moveSpeed);
        player.style.left = positionX + "px";
    }
    requestAnimationFrame(gameLoop);
}
gameLoop();
updateLives();
updateScore();

document.addEventListener("keydown", (event) => {
    if (gameOver || !gameStarted) return;
    if (event.key === "ArrowLeft") moveLeft = true;
    if (event.key === "ArrowRight") moveRight = true;
    if (event.key === "ArrowUp") jump();
    if (event.key === "ArrowDown") crouch(true);
});

document.addEventListener("keyup", (event) => {
    if (event.key === "ArrowLeft") moveLeft = false;
    if (event.key === "ArrowRight") moveRight = false;
    if (event.key === "ArrowDown") crouch(false);
});

function jump() {
    if (isJumping) return;
    isJumping = true;
    jumpSound.play();
    let upInterval = setInterval(() => {
        if (positionY >= 150) {
            clearInterval(upInterval);
            let downInterval = setInterval(() => {
                let landed = checkLanding();
                if (landed || positionY <= 0) {
                    clearInterval(downInterval);
                    if (landed) {
                        landSound.play();
                    }
                    isJumping = false;
                } else {
                    positionY -= 8;
                    player.style.bottom = positionY + "px";
                }
            }, 20);
        } else {
            positionY += 8;
            player.style.bottom = positionY + "px";
        }
    }, 20);
}

function crouch(state) {
    isCrouching = state;
    player.style.height = state ? "20px" : "40px";
}

function createObstacle() {
    if (!gameStarted) {
        setTimeout(createObstacle, 500);
        return;
    }

    const obstacle = document.createElement("div");
    obstacle.classList.add("obstacle");

    const isFlying = Math.random() < 0.5;
    if (isFlying) {
        obstacle.classList.add("flying");
        obstacle.style.bottom = "120px";
        obstacle.style.backgroundImage = "url('layouts/crocodillo.png')";
    } else {
        obstacle.style.bottom = "0px";
        obstacle.style.backgroundImage = "url('layouts/enemy.png')";
    }

    obstacle.style.left = "600px";
    game.appendChild(obstacle);

    let obstaclePosition = 600;
    const interval = setInterval(() => {
        if (gameOver) {
            clearInterval(interval);
            obstacle.remove();
            return;
        }

        obstaclePosition -= 10;
        obstacle.style.left = obstaclePosition + "px";

        if (obstacle.classList.contains("flying")) {
            let playerY = positionY + 35;
            let current = parseInt(obstacle.style.bottom);
            if (current < playerY) current += 2;
            else if (current > playerY) current -= 2;
            obstacle.style.bottom = current + "px";
        }

        const hitX = obstaclePosition < positionX + 28 && obstaclePosition + 35 > positionX;
        const isFlying = obstacle.classList.contains("flying");
        const shouldHit = (isFlying && !isCrouching) || (!isFlying && positionY < 35);

        if (hitX && shouldHit) {
            lives--;
            hitSound.play();
            updateLives();
            if (lives <= 0) {
                gameOverSound.play();
                gameOverScreen();
            }
            clearInterval(interval);
            obstacle.remove();
        }

        if (obstaclePosition < -40) {
            score += 10;
            scoreSound.play();
            updateScore();
            clearInterval(interval);
            obstacle.remove();
        }
    }, 20);

    setTimeout(createObstacle, Math.max(1000, 3000 - score * 20));
}
createObstacle();

function createBox() {
    if (!gameStarted || gameOver) {
        setTimeout(createBox, 3000);
        return;
    }

    const box = document.createElement("div");
    box.classList.add("box");
    box.style.bottom = "40px";
    box.style.left = "600px";
    game.appendChild(box);

    let boxX = 600;

    const interval = setInterval(() => {
        if (gameOver) {
            clearInterval(interval);
            box.remove();
            return;
        }

        boxX -= 5;
        box.style.left = boxX + "px";

        const boxRect = box.getBoundingClientRect();
        const playerRect = player.getBoundingClientRect();

        const landed = (
            playerRect.bottom <= boxRect.top + 10 &&
            playerRect.bottom >= boxRect.top - 10 &&
            playerRect.right > boxRect.left &&
            playerRect.left < boxRect.right &&
            isJumping
        );

        if (landed) {
            score += 15;
            updateScore();
            landSound.play();
            isJumping = false;
            positionY = parseInt(box.style.bottom) + 40;
            player.style.bottom = positionY + "px";
            clearInterval(interval);
            box.remove();
        }

        if (boxX < -60) {
            clearInterval(interval);
            box.remove();
        }
    }, 20);

    setTimeout(createBox, Math.random() * 4000 + 4000);
}
createBox();

function checkLanding() {
    const boxes = document.querySelectorAll(".box");
    for (let box of boxes) {
        const boxRect = box.getBoundingClientRect();
        const playerRect = player.getBoundingClientRect();
        const isAbove = playerRect.bottom <= boxRect.top + 10 && playerRect.bottom >= boxRect.top - 10;
        const isHorizontal = playerRect.right > boxRect.left && playerRect.left < boxRect.right;
        if (isAbove && isHorizontal) {
            positionY = parseInt(box.style.bottom) + 40;
            player.style.bottom = positionY + "px";
            return true;
        }
    }
    if (positionY <= 0) {
        positionY = 0;
        player.style.bottom = "0px";
        return true;
    }
    return false;
}

function gameOverScreen() {
    gameOver = true;

    if (score > bestScore) {
        localStorage.setItem("bestScore", score);
    }

    scoreHistory.push(score);
    localStorage.setItem("scoreHistory", JSON.stringify(scoreHistory));
    updateHistory();

    let characterHistory = JSON.parse(localStorage.getItem("characterHistory")) || [];
    characterHistory.push(selectedSkin);
    localStorage.setItem("characterHistory", JSON.stringify(characterHistory));

    const nbParties = scoreHistory.length;
    const moyenne = scoreHistory.reduce((acc, val) => acc + val, 0) / nbParties;
    const meilleur = Math.max(...scoreHistory);
    const pourcentageReussite = scoreHistory.filter(score => score >= 100).length / nbParties * 100;

    const countCharacters = characterHistory.reduce((acc, name) => {
        acc[name] = (acc[name] || 0) + 1;
        return acc;
    }, {});
    const mostUsed = Object.entries(countCharacters).sort((a, b) => b[1] - a[1])[0][0];

    const overlay = document.createElement("div");
    overlay.id = "gameOverScreen";
    overlay.innerHTML = `
        <h1>Game Over</h1>
        <p>Score final : ${score}</p>
        <h2>Statistiques :</h2>
        <ul style="text-align:left; font-size: 16px; line-height: 1.6;">
            <li><strong>Nombre de parties :</strong> ${nbParties}</li>
            <li><strong>Score moyen :</strong> ${moyenne.toFixed(1)}</li>
            <li><strong>Meilleur score :</strong> ${meilleur}</li>
            <li><strong>% de réussite (score > 100) :</strong> ${pourcentageReussite.toFixed(0)}%</li>
            <li><strong>Personnage préféré :</strong> ${mostUsed}</li>
        </ul>
        <button id="restart">Rejouer</button>
    `;
    document.body.appendChild(overlay);
    document.getElementById("restart").addEventListener("click", () => location.reload());
}

document.getElementById("showStats").addEventListener("click", () => {
    const scoreHistory = JSON.parse(localStorage.getItem("scoreHistory")) || [];
    const characterHistory = JSON.parse(localStorage.getItem("characterHistory")) || [];

    if (scoreHistory.length === 0) {
        alert("Aucune partie jouée !");
        return;
    }

    const nbParties = scoreHistory.length;
    const moyenne = scoreHistory.reduce((acc, val) => acc + val, 0) / nbParties;
    const meilleur = Math.max(...scoreHistory);
    const pourcentageReussite = scoreHistory.filter(score => score >= 100).length / nbParties * 100;

    const countCharacters = characterHistory.reduce((acc, name) => {
        acc[name] = (acc[name] || 0) + 1;
        return acc;
    }, {});
    const mostUsed = Object.entries(countCharacters).sort((a, b) => b[1] - a[1])[0][0];

    const popup = document.createElement("div");
    popup.className = "popup-stats";
    popup.innerHTML = `
        <h2>📊 Statistiques</h2>
        <ul>
            <li><strong>Nombre de parties :</strong> ${nbParties}</li>
            <li><strong>Score moyen :</strong> ${moyenne.toFixed(1)}</li>
            <li><strong>Meilleur score :</strong> ${meilleur}</li>
            <li><strong>% réussite (>100) :</strong> ${pourcentageReussite.toFixed(0)}%</li>
            <li><strong>Personnage préféré :</strong> ${mostUsed}</li>
        </ul>
        <button id="closeStats">Fermer</button>
    `;
    document.body.appendChild(popup);
    document.getElementById("closeStats").addEventListener("click", () => popup.remove());
});

document.getElementById("resetStats").addEventListener("click", () => {
    if (confirm("Tu veux vraiment tout effacer ?")) {
        localStorage.clear();
        alert("Statistiques réinitialisées !");
        location.reload();
    }
});

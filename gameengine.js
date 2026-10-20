let engine;

function setup() {
    createCanvas(windowWidth, windowHeight);
    engine = new GameEngine();
}

function draw() {
    engine.update();
    engine.draw();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    engine.calculateLayout();
}

class GameEngine {
    constructor() {
        this.calculateLayout();
        this.battery = new Battery(width / 2, 130, 90, 150);
        this.startTime = millis();
        this.elapsedTime = 0; // Em segundos
        this.isGameOver = false;
    }

    calculateLayout() {
        // Define os limites da caixa central (onde os elementos vão cair)
        this.bounds = {
            left: width * 0.24,
            right: width * 0.76,
            top: 130,
            bottom: height - 180
        };

        if (this.battery) {
            this.battery.x = width / 2;
        }
    }

    update() {
        if (this.isGameOver) return;

        // Atualiza o relógio
        this.elapsedTime = (millis() - this.startTime) / 1000;

        // Atualiza a bateria
        this.battery.update();

        // Verifica Game Over
        if (this.battery.charge <= 0) {
            this.isGameOver = true;
        }
    }

    draw() {
        background(255);

        // 1. Desenhar linhas do circuito (Verdes) e limites da área de spawn
        this.drawCircuitLines();

        // 2. Desenhar as 6 casas (3 à esquerda, 3 à direita)
        this.drawHouses();

        // 3. Desenhar a Bateria
        this.battery.draw();

        // 4. Desenhar o Relógio Digital
        this.drawClock();

        // 5. Ecrã de Game Over (se a bateria acabar)
        if (this.isGameOver) {
            this.drawGameOver();
        }
    }

    drawCircuitLines() {
        push();
        stroke(46, 168, 92); // Verde das linhas
        strokeWeight(2);
        noFill();

        let midX = width / 2;
        let batY = 130;

        // Linhas que saem da bateria para a esquerda e direita (delimitam a zona de jogo!)
        line(midX - 45, batY, this.bounds.left, batY);
        line(this.bounds.left, batY, this.bounds.left, this.bounds.bottom);

        line(midX + 45, batY, this.bounds.right, batY);
        line(this.bounds.right, batY, this.bounds.right, this.bounds.bottom);

        // Linha vertical central (da bateria até às máquinas em baixo)
        line(midX, batY + 75, midX, this.bounds.bottom + 50);

        // Ramificações inferiores para as 3 máquinas (Eólica, Painel, Motor de Água)
        let branchY = this.bounds.bottom + 10;
        let leftMachineX = midX - 180;
        let rightMachineX = midX + 180;

        line(leftMachineX, branchY, rightMachineX, branchY);
        line(leftMachineX, branchY, leftMachineX, branchY + 40);
        line(rightMachineX, branchY, rightMachineX, branchY + 40);

        // Linhas horizontais para as casas (3 de cada lado)
        let houseYPositions = [height * 0.28, height * 0.52, height * 0.76];
        for (let y of houseYPositions) {
            // Esquerda
            line(this.bounds.left, y, 90, y);
            // Direita
            line(this.bounds.right, y, width - 90, y);
        }

        pop();
    }

    drawHouses() {
        let houseYPositions = [height * 0.28, height * 0.52, height * 0.76];
        let hasPower = this.battery.charge > 0;

        for (let y of houseYPositions) {
            this.drawSingleHouse(55, y, hasPower);          // Casas da esquerda
            this.drawSingleHouse(width - 55, y, hasPower);  // Casas da direita
        }
    }

    drawSingleHouse(x, y, hasPower) {
        push();
        translate(x, y);
        stroke(120);
        strokeWeight(1.5);

        // Corpo da casa
        fill(240);
        rectMode(CENTER);
        rect(0, 10, 60, 50);

        // Telhado
        fill(245);
        triangle(-38, -15, 38, -15, 0, -42);

        // Porta
        fill(210, 220, 215);
        rect(0, 22, 14, 26);

        // Janelas (Acesas a amarelo se houver bateria, apagadas a cinzento se não houver)
        noStroke();
        if (hasPower) {
            fill(245, 195, 68); // Luz acesa
        } else {
            fill(100); // Luz apagada
        }
        rect(-16, 4, 10, 10);
        rect(16, 4, 10, 10);

        pop();
    }

    drawClock() {
        push();
        let clockX = width - 150;
        let clockY = 40;

        // Caixa preta do relógio
        fill(0);
        noStroke();
        rectMode(CORNER);
        rect(clockX, clockY, 125, 42);

        // Formatar tempo (MM:SS.ms)
        let mins = floor(this.elapsedTime / 60);
        let secs = floor(this.elapsedTime % 60);
        let millisecs = floor((this.elapsedTime % 1) * 100);

        let minStr = nf(mins, 2);
        let secStr = nf(secs, 2);
        let msStr = nf(millisecs, 2);

        // Texto laranja estilo digital
        fill(245, 140, 20);
        textFont('Courier New', 26);
        textStyle(BOLD);
        textAlign(LEFT, BASELINE);
        text(`${minStr}:${secStr}`, clockX + 10, clockY + 30);

        textSize(14);
        text(`.${msStr}`, clockX + 88, clockY + 30);
        pop();
    }

    drawGameOver() {
        push();
        fill(0, 0, 0, 180);
        rectMode(CORNER);
        rect(0, 0, width, height);

        fill(255);
        textAlign(CENTER, CENTER);
        textSize(40);
        text("SEM ENERGIA!", width / 2, height / 2 - 20);
        textSize(20);
        text(`Mantiveste as casas ligadas durante ${this.elapsedTime.toFixed(2)} segundos.`, width / 2, height / 2 + 30);
        pop();
    }
}
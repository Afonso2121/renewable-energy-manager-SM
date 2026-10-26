let engine;

function setup() {
    createCanvas(windowWidth, windowHeight);
    engine = new GameEngine();
}

function draw() {
    engine.update();
    engine.draw();
}

function mousePressed() {
    engine.handleMousePressed();
}

function mouseReleased() {
    engine.handleMouseReleased();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    engine.calculateLayout();
}

class GameEngine {
    constructor() {
        this.calculateLayout();
        this.battery = new Battery(width / 2, 130, 90, 150);
        this.machines = [];
        this.setupMachines();

        this.elements = [];
        this.draggedElement = null;
        this.lastSpawnTime = 0;
        this.spawnInterval = 1200; // Spawna um elemento a cada 1.2 segundos

        // Ciclo Dia/Noite
        this.isDay = true;
        this.dayAmount = 1;
        this.minPhaseTime = 15000;
        this.maxPhaseTime = 30000;
        this.nextPhaseChange = 0;
        this.startTime = millis();
        this.elapsedTime = 0; // Em segundos
        this.gameState = 'START'; // Estados: 'START', 'PLAYING', 'GAMEOVER'
        this.audioController = new AudioGameController(0.08, 2000);
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
        if (this.machines && this.machines.length > 0) {
            this.setupMachines();
        }
    }

    setupMachines() {
        let midX = width / 2;
        let machineY = this.bounds.bottom + 85;

        this.machines = [
            new Machine(midX - 180, machineY, 'wind', 'wind'),
            new Machine(midX, machineY, 'solar', 'sun'),
            new Machine(midX + 180, machineY, 'water', 'water')
        ];
    }

    spawnElement() {
        // Define que elementos podem cair (de noite o sol não spawna)
        let availableTypes = ['water', 'wind', 'thunder'];
        if (this.isDay) {
            availableTypes.push('sun');
        }

        let type = random(availableTypes);

        // Garante que nasce apenas dentro das linhas verdes e sem bater na bateria ao centro
        let x;
        if (random() < 0.5) {
            x = random(this.bounds.left + 30, width / 2 - 70);
        } else {
            x = random(width / 2 + 70, this.bounds.right - 30);
        }

        let y = this.bounds.top + 20;
        this.elements.push(new Element(x, y, type));
    }

    update() {
        if (this.gameState === 'START') {
            this.audioController.updateCalibration();
            return;
        }
        if (this.gameState === 'GAMEOVER') return;

        // Atualiza o relógio
        this.elapsedTime = (millis() - this.startTime) / 1000;

        // Ciclo Dia/Noite: troca de fase em instantes aleatórios
        if (millis() >= this.nextPhaseChange) {
            this.isDay = !this.isDay;
            this.nextPhaseChange = millis() + random(this.minPhaseTime, this.maxPhaseTime);
        }
        // Transição suave do fundo
        this.dayAmount = lerp(this.dayAmount, this.isDay ? 1 : 0, 0.02);

        // Atualiza a bateria
        this.battery.update();

        for (let m of this.machines) {
            m.update();
        }

        let hasBroken = this.machines.some(m => m.state === 'BROKEN');
        if (this.audioController.update(hasBroken)) {
            for (let m of this.machines) {
                if (m.state === 'BROKEN') {
                    m.startRecovery();
                }
            }
        }

        // Gerar novos elementos periodicamente
        if (millis() - this.lastSpawnTime > this.spawnInterval) {
            this.spawnElement();
            this.lastSpawnTime = millis();
        }

        // Atualizar elementos e remover os que saírem pelo fundo da área de jogo
        for (let i = this.elements.length - 1; i >= 0; i--) {
            let el = this.elements[i];
            el.update();

            if (!el.isDragging && el.y > this.bounds.bottom + 20) {
                this.elements.splice(i, 1);
            }
        }

        // Verifica Game Over
        if (this.battery.charge <= 0) {
            this.gameState = 'GAMEOVER';
        }
    }

    handleMousePressed() {
        this.audioController.init();

        if (this.gameState === 'START') {
            let barW = 300, barH = 30;
            let barX = width / 2 - barW / 2, barY = height / 2 - 10;
            this.audioController.checkCalibrationClick(mouseX, mouseY, barX, barY, barW, barH);

            let btnW = 200, btnH = 50;
            let btnX = width / 2 - btnW / 2, btnY = height / 2 + 70;
            if (mouseX >= btnX && mouseX <= btnX + btnW && mouseY >= btnY && mouseY <= btnY + btnH) {
                this.gameState = 'PLAYING';
                this.startTime = millis();
                this.lastSpawnTime = millis();
                this.isDay = true;
                this.dayAmount = 1;
                this.nextPhaseChange = millis() + random(this.minPhaseTime, this.maxPhaseTime);
            }
            return;
        }

        if (this.gameState === 'GAMEOVER') return;

        // Procura de trás para a frente (para agarrar o elemento que está por cima)
        for (let i = this.elements.length - 1; i >= 0; i--) {
            if (this.elements[i].contains(mouseX, mouseY)) {
                this.draggedElement = this.elements[i];
                this.draggedElement.isDragging = true;
                break;
            }
        }
    }

    handleMouseReleased() {
        if (!this.draggedElement) return;

        let droppedOnMachine = false;

        // Verifica se largou em cima de alguma das 3 máquinas
        for (let m of this.machines) {
            if (m.contains(this.draggedElement.x, this.draggedElement.y)) {
                droppedOnMachine = true;
                let success = m.receiveElement(this.draggedElement.type);
                if (success) {
                    this.battery.addCharge(12); // Dá +12% de bateria se acertar!
                }
                break;
            }
        }

        // Se largou numa máquina ou fora dos limites laterais, o elemento desaparece
        if (
            droppedOnMachine ||
            this.draggedElement.x < this.bounds.left ||
            this.draggedElement.x > this.bounds.right
        ) {
            let idx = this.elements.indexOf(this.draggedElement);
            if (idx !== -1) this.elements.splice(idx, 1);
        } else {
            // Se largou a meio do ecrã, continua a cair
            this.draggedElement.isDragging = false;
        }

        this.draggedElement = null;
    }

    draw() {
        background(lerpColor(color(18, 22, 46), color(255), this.dayAmount));

        // 1. Desenhar linhas do circuito (Verdes) e limites da área de spawn
        this.drawCircuitLines();

        // 2. Desenhar as 6 casas (3 à esquerda, 3 à direita)
        this.drawHouses();

        for (let m of this.machines) {
            m.draw();
        }

        for (let el of this.elements) {
            el.draw();
        }

        this.battery.draw();

        // 4. Desenhar o Relógio Digital
        this.drawClock();
        this.drawSkyIcon();

        let hasBroken = this.machines.some(m => m.state === 'BROKEN');
        this.audioController.draw(hasBroken);

        if (this.gameState === 'START') {
            this.drawStartScreen();
        } else if (this.gameState === 'GAMEOVER') {
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

    drawSkyIcon() {
        push();
        noStroke();
        let x = width - 175, y = 61;
        if (this.isDay) {
            // Durante o dia, desenha o Sol.
            fill(245, 176, 37);
            ellipse(x, y, 22, 22);
        } else {
            // À noite, sobrepõe um círculo escuro à Lua para criar a forma crescente.
            fill(220, 225, 240);
            ellipse(x, y, 22, 22);
            fill(18, 22, 46);
            ellipse(x + 7, y - 3, 18, 18);
        }
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

    drawStartScreen() {
        push();
        fill(0, 0, 0, 210);
        rectMode(CORNER);
        rect(0, 0, width, height);

        fill(255);
        textAlign(CENTER, CENTER);
        textSize(32);
        textStyle(BOLD);
        text("CALIBRAÇÃO DO MICROFONE", width / 2, height / 2 - 110);

        textSize(16);
        textStyle(NORMAL);
        if (!this.audioController.isInitialized) {
            fill(245, 166, 35);
            text("1. Clica em qualquer sítio para ativar o microfone.", width / 2, height / 2 - 60);
        } else {
            fill(200);
            text("Faz barulho para testar! Clica na barra para ajustar a linha vermelha (meta de volume).", width / 2, height / 2 - 60);
        }

        let barW = 300, barH = 30;
        this.audioController.drawCalibration(width / 2 - barW / 2, height / 2 - 10, barW, barH);

        let btnW = 200, btnH = 50;
        let btnX = width / 2 - btnW / 2, btnY = height / 2 + 70;
        fill(46, 168, 92);
        noStroke();
        rect(btnX, btnY, btnW, btnH, 8);

        fill(255);
        textSize(20);
        textStyle(BOLD);
        text("COMEÇAR JOGO", width / 2, btnY + btnH / 2);
        pop();
    }
}
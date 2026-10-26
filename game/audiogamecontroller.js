class AudioGameController {
    constructor(threshold = 0.08, requiredDuration = 2000) {
        this.threshold = threshold; // Meta de volume (0.0 a 0.3)
        this.requiredDuration = requiredDuration; // 2000ms (2 segundos)

        this.mic = null;
        this.isInitialized = false;

        this.currentLevel = 0;
        this.loudStartTime = null;
        this.progress = 0;
    }

    init() {
        if (this.isInitialized) return;
        // O browser exige uma interação do utilizador antes de ativar o áudio.
        userStartAudio();
        this.mic = new p5.AudioIn();
        this.mic.start();
        this.isInitialized = true;
    }

    // Lê o microfone apenas para mostrar na barra de calibração do Menu Inicial
    updateCalibration() {
        if (!this.isInitialized) return;
        this.currentLevel = this.mic.getLevel();
    }

    // Lê o microfone durante o jogo quando há máquinas avariadas
    update(hasBrokenMachines) {
        if (!this.isInitialized || !hasBrokenMachines) {
            this.loudStartTime = null;
            this.progress = 0;
            this.currentLevel = 0;
            return false;
        }

        this.currentLevel = this.mic.getLevel();

        if (this.currentLevel >= this.threshold) {
            if (this.loudStartTime === null) {
                this.loudStartTime = millis();
            }
            let elapsed = millis() - this.loudStartTime;
            this.progress = constrain(elapsed / this.requiredDuration, 0, 1);

            // Só devolve true após segurar o volume durante 2 segundos seguidos
            if (elapsed >= this.requiredDuration) {
                this.loudStartTime = null;
                this.progress = 0;
                return true;
            }
        } else {
            // O jogador tem de manter o volume acima do limite sem interrupções.
            this.loudStartTime = null;
            this.progress = 0;
        }

        return false;
    }

    // Permite ao jogador clicar na barra do menu inicial para ajustar a linha vermelha
    checkCalibrationClick(mx, my, barX, barY, barW, barH) {
        if (mx >= barX && mx <= barX + barW && my >= barY && my <= barY + barH) {
            this.threshold = map(mx, barX, barX + barW, 0.02, 0.3, true);
        }
    }

    // Desenha o medidor no Ecrã Inicial
    drawCalibration(barX, barY, barW, barH) {
        push();
        fill(40);
        stroke(120);
        strokeWeight(2);
        rectMode(CORNER);
        rect(barX, barY, barW, barH, 6);

        if (this.isInitialized) {
            noStroke();
            fill(this.currentLevel >= this.threshold ? color(46, 168, 92) : color(245, 166, 35));
            let volW = map(this.currentLevel, 0, 0.3, 0, barW, true);
            rect(barX, barY, volW, barH, 6);
        }

        // Linha vermelha do limite calibrado
        let threshX = barX + map(this.threshold, 0, 0.3, 0, barW, true);
        stroke(217, 48, 37);
        strokeWeight(4);
        line(threshX, barY - 6, threshX, barY + barH + 6);
        pop();
    }

    // Desenha o medidor no topo durante o jogo quando uma máquina avaria
    draw(hasBrokenMachines) {
        if (!hasBrokenMachines) return;

        push();
        let barW = 220;
        let barH = 22;
        let x = width / 2 - barW / 2;
        let y = 25;

        this.drawCalibration(x, y, barW, barH);

        // Barra azul dos 2 segundos
        noStroke();
        fill(52, 152, 219);
        rectMode(CORNER);
        rect(x, y + barH + 6, barW * this.progress, 6, 3);

        fill(255);
        textAlign(CENTER, CENTER);
        textSize(12);
        textStyle(BOLD);
        text(`FAZ BARULHO! (${(this.progress * 2).toFixed(1)}s / 2.0s)`, width / 2, y + barH / 2);
        pop();
    }
}
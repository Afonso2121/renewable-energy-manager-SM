class Machine {
    constructor(x, y, type, acceptedElement) {
        this.x = x;
        this.y = y;
        this.width = 90;
        this.height = 90;
        this.type = type; // 'wind', 'solar', 'water'
        this.acceptedElement = acceptedElement; // 'wind', 'sun', 'water'

        // Estados possíveis: 'ACTIVE', 'BROKEN', 'RECOVERING'
        this.state = 'ACTIVE';
        this.recoveryStartTime = 0;
        this.recoveryDuration = 3000; // 3 segundos para voltar após o som
        this.bladeAngle = 0; // Para animar a eólica e a turbina de água
    }

    update() {
        // Se estiver a recuperar (após os 2s de som), conta 3 segundos para ficar ativa
        if (this.state === 'RECOVERING') {
            if (millis() - this.recoveryStartTime >= this.recoveryDuration) {
                this.state = 'ACTIVE';
            }
        }

        // Animação simples quando a máquina está ativa
        if (this.state === 'ACTIVE') {
            this.bladeAngle += 0.04;
        }
    }

    // Verifica se uma coordenada (x, y) está dentro da área da máquina
    contains(px, py) {
        return (
            px >= this.x - this.width / 2 &&
            px <= this.x + this.width / 2 &&
            py >= this.y - this.height / 2 &&
            py <= this.y + this.height / 2
        );
    }

    // Recebe um elemento largado pelo jogador e devolve true (carrega) ou false (avaria/ignora)
    receiveElement(elementType) {
        // Se já estiver avariada ou a recuperar, não aceita elementos
        if (this.state !== 'ACTIVE') return false;

        // Se for o elemento certo (e não for trovão)
        if (elementType === this.acceptedElement) {
            return true; // Sucesso: vai dar carga à bateria
        } else {
            // Elemento errado ou trovão: a máquina avaria!
            this.breakMachine();
            return false;
        }
    }

    breakMachine() {
        this.state = 'BROKEN';
    }

    startRecovery() {
        if (this.state === 'BROKEN') {
            this.state = 'RECOVERING';
            this.recoveryStartTime = millis();
        }
    }

    draw() {
        push();
        translate(this.x, this.y);

        // Desenha a máquina consoante o tipo
        if (this.type === 'wind') {
            this.drawWindTurbine();
        } else if (this.type === 'solar') {
            this.drawSolarPanel();
        } else if (this.type === 'water') {
            this.drawWaterMotor();
        }

        // Feedback visual se estiver AVARIADA ou A RECUPERAR
        if (this.state === 'BROKEN') {
            fill(217, 48, 37, 180);
            noStroke();
            ellipse(0, 0, 80, 80);
            fill(255);
            textAlign(CENTER, CENTER);
            textSize(14);
            textStyle(BOLD);
            text("AVARIADA!\n(Fala 2s)", 0, 0);
        } else if (this.state === 'RECOVERING') {
            let remaining = ceil((this.recoveryDuration - (millis() - this.recoveryStartTime)) / 1000);
            fill(245, 166, 35, 200);
            noStroke();
            ellipse(0, 0, 80, 80);
            fill(255);
            textAlign(CENTER, CENTER);
            textSize(16);
            textStyle(BOLD);
            text(`A voltar...\n${remaining}s`, 0, 0);
        }

        pop();
    }

    drawWindTurbine() {
        // Base e poste
        noStroke();
        fill(120);
        rectMode(CENTER);
        rect(0, 42, 40, 8, 4);
        rect(0, 12, 6, 60);

        // Pás da eólica
        push();
        translate(0, -18);
        rotate(this.bladeAngle);
        fill(46, 168, 92);
        for (let i = 0; i < 3; i++) {
            rect(0, -22, 6, 36, 4);
            rotate(TWO_PI / 3);
        }
        fill(100);
        ellipse(0, 0, 10, 10);
        pop();
    }

    drawSolarPanel() {
        // Suporte
        noStroke();
        fill(120);
        rectMode(CENTER);
        rect(0, 42, 40, 6, 3);
        rect(0, 28, 6, 26);

        // Painel azul com grelha
        stroke(120);
        strokeWeight(3);
        fill(52, 122, 168);
        rect(0, 0, 75, 48, 6);

        // Linhas da grelha branca
        stroke(220);
        strokeWeight(1.5);
        line(-35, 0, 35, 0);
        line(-12, -22, -12, 22);
        line(12, -22, 12, 22);
    }

    drawWaterMotor() {
        // Tubos laterais
        stroke(120);
        strokeWeight(5);
        noFill();
        line(-38, -5, -25, -5);
        line(-38, -5, -38, 12);
        line(25, -5, 38, -5);
        line(38, -5, 38, 12);

        // Corpo verde do motor
        noStroke();
        fill(46, 168, 92);
        rectMode(CENTER);
        rect(0, 0, 52, 46, 8);

        // Roda/Turbina interior
        stroke(255);
        strokeWeight(2);
        fill(46, 168, 92);
        ellipse(0, 0, 28, 28);

        push();
        rotate(this.bladeAngle);
        for (let i = 0; i < 4; i++) {
            line(-10, 0, 10, 0);
            rotate(PI / 4);
        }
        pop();

        // Ondas de água por baixo
        noFill();
        stroke(42, 130, 188);
        strokeWeight(2.5);
        beginShape();
        for (let x = -40; x <= 40; x += 10) {
            let y = 35 + sin(x * 0.25 + frameCount * 0.1) * 3;
            vertex(x, y);
        }
        endShape();
    }
}
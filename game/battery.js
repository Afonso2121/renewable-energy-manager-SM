class Battery {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.charge = 100; // Começa a 100%
        this.maxCharge = 100;
        this.drainRate = 0.04; // Velocidade a que a bateria desce (ajustável)
    }

    update() {
        // A bateria perde carga continuamente
        if (this.charge > 0) {
            this.charge -= this.drainRate;
            if (this.charge < 0) this.charge = 0;
        }
    }

    addCharge(amount) {
        this.charge += amount;
        if (this.charge > this.maxCharge) {
            this.charge = this.maxCharge;
        }
    }

    draw() {
        push();

        // Polo superior da bateria
        noStroke();
        fill(46, 168, 92); // Verde do design
        rectMode(CENTER);
        rect(this.x, this.y - this.height / 2 - 8, this.width * 0.45, 16, 4);

        // Corpo base da bateria (fundo escuro para quando estiver vazia)
        stroke(46, 168, 92);
        strokeWeight(4);
        fill(230);
        rect(this.x, this.y, this.width, this.height, 12);

        // Nível de carga interior (calculado em função da percentagem)
        noStroke();
        if (this.charge > 50) {
            fill(46, 168, 92); // Verde
        } else if (this.charge > 20) {
            fill(245, 166, 35); // Laranja
        } else {
            fill(217, 48, 37); // Vermelho (crítico)
        }

        let chargeHeight = map(this.charge, 0, this.maxCharge, 0, this.height - 8);
        rectMode(CORNER);
        // Desenha de baixo para cima
        rect(
            this.x - this.width / 2 + 4,
            this.y + this.height / 2 - 4 - chargeHeight,
            this.width - 8,
            chargeHeight,
            8
        );

        // Ícone do raio branco no centro da bateria
        fill(255);
        beginShape();
        vertex(this.x + 6, this.y - 35);
        vertex(this.x - 18, this.y + 5);
        vertex(this.x - 2, this.y + 5);
        vertex(this.x - 8, this.y + 40);
        vertex(this.x + 18, this.y - 5);
        vertex(this.x + 2, this.y - 5);
        endShape(CLOSE);

        pop();
    }
}
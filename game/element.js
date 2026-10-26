class Element {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'sun', 'water', 'wind', 'thunder'
        this.radius = 24; // Raio para facilitar o clique do rato
        this.speed = random(1.5, 3.0); // Velocidade de queda
        this.isDragging = false;
    }

    update() {
        if (this.isDragging) {
            // Segue o rato enquanto está a ser arrastado
            this.x = mouseX;
            this.y = mouseY;
        } else {
            // Cai continuamente
            this.y += this.speed;
        }
    }

    // Verifica se o rato clicou em cima deste elemento
    contains(px, py) {
        return dist(px, py, this.x, this.y) <= this.radius;
    }

    draw() {
        push();
        translate(this.x, this.y);

        if (this.type === 'sun') {
            this.drawSun();
        } else if (this.type === 'water') {
            this.drawWater();
        } else if (this.type === 'wind') {
            this.drawWind();
        } else if (this.type === 'thunder') {
            this.drawThunder();
        }

        pop();
    }

    drawSun() {
        noStroke();
        fill(245, 176, 37);
        ellipse(0, 0, 18, 18);

        stroke(245, 176, 37);
        strokeWeight(2.5);
        for (let i = 0; i < 8; i++) {
            let angle = i * (TWO_PI / 8);
            let x1 = cos(angle) * 13;
            let y1 = sin(angle) * 13;
            let x2 = cos(angle) * 18;
            let y2 = sin(angle) * 18;
            line(x1, y1, x2, y2);
        }
    }

    drawWater() {
        noStroke();
        fill(74, 163, 217);
        beginShape();
        vertex(0, -16);
        bezierVertex(14, 0, 12, 16, 0, 16);
        bezierVertex(-12, 16, -14, 0, 0, -16);
        endShape(CLOSE);

        // Reflexo branco na gota
        stroke(255);
        strokeWeight(2);
        noFill();
        arc(-3, 5, 10, 10, PI * 0.6, PI * 1.1);
    }

    drawWind() {
        noFill();
        stroke(130, 145, 138);
        strokeWeight(2);
        // Linhas de vento com caracol na ponta
        line(-14, -6, 6, -6);
        arc(6, -9, 6, 6, -HALF_PI, HALF_PI);

        line(-18, 0, 10, 0);
        line(-12, 6, 2, 6);

        // Pequena folha verde
        noStroke();
        fill(46, 168, 92);
        ellipse(6, 7, 8, 5);
    }

    drawThunder() {
        noStroke();
        fill(245, 185, 35);
        beginShape();
        vertex(4, -16);
        vertex(-10, 2);
        vertex(-1, 2);
        vertex(-6, 16);
        vertex(10, -2);
        vertex(1, -2);
        endShape(CLOSE);
    }
}
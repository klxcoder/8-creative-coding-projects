const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// setup
const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

class Particle {
  constructor(effect, index) {
    this.effect = effect;
    this.index = index;
    this.radius = getRandomInt(4, 15);
    this.reset();
    this.vx = Math.random() - 0.5;
    this.vy = Math.random() - 0.5;
    this.pushX = 0;
    this.pushY = 0;
    this.friction = 0.8;
  }
  drawLine(context) {
    if (this.index % 5 === 0) {
      context.save();
      context.globalAlpha = 0.2;
      context.beginPath();
      context.moveTo(this.x, this.y);
      context.lineTo(this.effect.mouse.x, this.effect.mouse.y);
      context.stroke();
      context.restore();
    }
  }
  drawParticle(context) {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }
  update() {
    if (this.effect.mouse.pressed) {
      const dx = this.x - this.effect.mouse.x;
      const dy = this.y - this.effect.mouse.y;
      const distance = Math.hypot(dy, dx);
      const force = this.effect.mouse.radius / distance;
      if (distance < this.effect.mouse.radius) {
        const angle = Math.atan2(dy, dx);
        this.pushX += Math.cos(angle) * force;
        this.pushY += Math.sin(angle) * force;
      }
    }
    this.x += (this.pushX *= this.friction) + this.vx;
    this.y += (this.pushY *= this.friction) + this.vy;
    if (this.x < this.radius) {
      this.x = this.radius;
      this.vx *= -1;
    } else if (this.x > this.effect.width - this.radius) {
      this.x = this.effect.width - this.radius;
      this.vx *= -1;
    }

    if (this.y < this.radius) {
      this.y = this.radius;
      this.vy *= -1;
    } else if (this.y > this.effect.height - this.radius) {
      this.y = this.effect.height - this.radius;
      this.vy *= -1;
    }
  }
  reset() {
    this.x = this.radius + getRandomInt(0, this.effect.width - this.radius * 2);
    this.y = this.radius + getRandomInt(0, this.effect.height - this.radius * 2);
  }
}

class Effect {
  constructor(canvas, context) {
    this.canvas = canvas;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.context = context;
    this.particles = [];
    this.numberOfParticles = 200;
    this.initCtx();
    this.createParticles();

    this.mouse = {
      x: 0,
      y: 0,
      pressed: false,
      radius: 150,
    }

    window.addEventListener('resize', () => { // use arrow function, not use regular function
      this.resize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener('mousemove', (event) => {
      if (this.mouse.pressed) {
        this.assignMouseCordinate(event);
      }
    });

    window.addEventListener('mousedown', (event) => {
      this.mouse.pressed = true;
      this.assignMouseCordinate(event);
    });

    window.addEventListener('mouseup', () => {
      this.mouse.pressed = false;
    });

  }
  initCtx() {
    const gradient = this.context.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, 'white');
    gradient.addColorStop(1, 'gold');
    this.context.fillStyle = gradient;
    this.context.strokeStyle = gradient;
  }
  assignMouseCordinate(event) {
    this.mouse.x = event.x;
    this.mouse.y = event.y;
  }
  createParticles() {
    for (let i = 0; i < this.numberOfParticles; i++) {
      this.particles.push(new Particle(this, i));
    }
  }
  handleParticles(context) {
  }
  resize(width, height) {
    // change canvas width or height will reset ctx, even ctx.save() won't work
    this.width = this.canvas.width = width;
    this.height = this.canvas.height = height;
    // Have to re-define ctx styles after resizing canvas
    this.initCtx();
    // Reset particles
    this.particles.forEach((particle) => particle.reset());
  }
}

class SunriseEffect extends Effect {
  constructor(canvas, context) {
    super(canvas, context);
  }
  handleParticles(context) {
    this.connectParticles(context);
    this.particles.forEach((particle) => {
      particle.drawLine(context);
      particle.drawParticle(context);
      particle.update();
    });
  }
  connectParticles(context) {
    const MAX_DISTANCE_SQUARE = 100 * 100; // 100px
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const distance_square = dx * dx + dy * dy;
        if (distance_square < MAX_DISTANCE_SQUARE) {
          context.save();
          const opacity = 1 - distance_square / MAX_DISTANCE_SQUARE;
          context.globalAlpha = opacity;
          context.beginPath();
          context.moveTo(this.particles[i].x, this.particles[i].y);
          context.lineTo(this.particles[j].x, this.particles[j].y);
          context.stroke();
          context.restore();
        }
      }
    }
  }
}

class BubbleEffect extends Effect {
  constructor(canvas, context) {
    super(canvas, context);
  }
  handleParticles(context) {
    this.particles.forEach((particle) => {
      particle.drawParticle(context);
      particle.update();
    });
  }
}

const effects = [
  new BubbleEffect(canvas, ctx),
  new SunriseEffect(canvas, ctx),
];
let effectIndex = 0;
let effect = effects[effectIndex];

document.addEventListener('contextmenu', (e) => {
  effectIndex = (effectIndex + 1) % effects.length;
  effect = effects[effectIndex];
  // Prevent default context menu from appearing
  e.preventDefault();
});

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  effect.handleParticles(ctx);
  requestAnimationFrame(animate);
}
animate();
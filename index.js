// setup
const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function initCtx(canvas, ctx) {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, 'white');
  gradient.addColorStop(0.5, 'magenta');
  gradient.addColorStop(1, 'blue');
  ctx.fillStyle = gradient;
  ctx.strokeStyle = 'white';
}
initCtx(canvas, ctx);

class Particle {
  constructor(effect) {
    this.effect = effect;
    this.radius = Math.random() * 5 + 2;
    this.reset();
    this.vx = Math.random() * 1 - 0.5;
    this.vy = Math.random() * 1 - 0.5;
  }
  draw(context) {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }
  update() {
    if (this.effect.mouse.pressed) {
      const dx = this.x - this.effect.mouse.x;
      const dy = this.y - this.effect.mouse.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < this.effect.mouse.radius) {
        this.vx += dx / 500;
        this.vy += dy / 500;
      }
    }
    this.x += this.vx;
    this.y += this.vy;
    if (this.x > this.effect.width - this.radius || this.x < this.radius) this.vx *= -1;
    if (this.y > this.effect.height - this.radius || this.y < this.radius) this.vy *= -1;
  }
  reset() {
    this.x = this.radius + Math.random() * (this.effect.width - this.radius * 2);
    this.y = this.radius + Math.random() * (this.effect.height - this.radius * 2);
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
    this.createParticles();

    this.mouse = {
      x: 0,
      y: 0,
      pressed: false,
      radius: 150,
    }

    window.addEventListener('resize', (event) => { // use arrow function, not use regular function
      this.resize(event.target.window.innerWidth, event.target.window.innerHeight);
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

    window.addEventListener('mouseup', (event) => {
      this.mouse.pressed = false;
    });

  }
  assignMouseCordinate(event) {
    this.mouse.x = event.x;
    this.mouse.y = event.y;
  }
  createParticles() {
    for (let i = 0; i < this.numberOfParticles; i++) {
      this.particles.push(new Particle(this));
    }
  }
  handleParticles(context) {
    this.connectParticles(context);
    this.particles.forEach((particle) => {
      particle.draw(context);
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
  resize(width, height) {
    // change canvas width or height will reset ctx, even ctx.save() won't work
    this.width = this.canvas.width = width;
    this.height = this.canvas.height = height;
    // Have to re-define ctx styles after resizing canvas
    initCtx(this.canvas, this.context);
    // Reset particles
    this.particles.forEach((particle) => particle.reset());
  }
}

const effect = new Effect(canvas, ctx);

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  effect.handleParticles(ctx);
  requestAnimationFrame(animate);
}
animate();
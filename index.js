const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// setup
const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Particle Class with Plugin Support
class Particle {
  constructor(effect, index, plugins = []) {
    this.effect = effect;
    this.index = index;
    this.radius = getRandomInt(4, 15);
    this.reset();
    this.vx = Math.random() - 0.5;
    this.vy = Math.random() - 0.5;
    this.pushX = 0;
    this.pushY = 0;
    this.friction = 0.8;
    this.plugins = plugins;
  }
  draw(context) {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    this.plugins.forEach(plugin => plugin.draw(this, context));
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

// Plugins
const LineDrawer = {
  draw(particle, context) {
    if (particle.index % 5 === 0) {
      context.save();
      context.globalAlpha = 0.2;
      context.beginPath();
      context.moveTo(particle.x, particle.y);
      context.lineTo(particle.effect.mouse.x, particle.effect.mouse.y);
      context.stroke();
      context.restore();
    }
  }
}

const Connector = {
  draw(particle, context) {
    const MAX_DISTANCE_SQUARE = 100 * 100;
    for (let i = particle.index + 1; i < particle.effect.particles.length; i++) {
      const other = particle.effect.particles[i];
      if (particle !== other) {
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const distance_square = dx * dx + dy * dy;
        if (distance_square < MAX_DISTANCE_SQUARE) {
          context.save();
          const opacity = 1 - distance_square / MAX_DISTANCE_SQUARE;
          context.globalAlpha = opacity;
          context.beginPath();
          context.moveTo(particle.x, particle.y);
          context.lineTo(other.x, other.y);
          context.stroke();
          context.restore();
        }
      }
    };
  }
};

class Effect {
  constructor({
    canvas,
    context,
    plugins = [],
    colorStops = [],
  }) {
    this.canvas = canvas;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.context = context;
    this.particles = [];
    this.plugins = plugins;
    this.colorStops = colorStops;
    this.numberOfParticles = 200;
    this.initCtx();
    this.createParticles();

    this.mouse = {
      x: 0,
      y: 0,
      pressed: false,
      radius: 150,
    }
  }
  initCtx() {
    const gradient = this.context.createLinearGradient(0, 0, 0, this.canvas.height);
    this.colorStops.forEach((colorStop, index) => gradient.addColorStop(index / (this.colorStops.length - 1), colorStop));
    this.context.fillStyle = gradient;
    this.context.strokeStyle = gradient;
  }
  assignMouseCordinate(event) {
    this.mouse.x = event.x;
    this.mouse.y = event.y;
  }
  createParticles() {
    for (let i = 0; i < this.numberOfParticles; i++) {
      this.particles.push(new Particle(this, i, this.plugins));
    }
  }
  handleParticles(context) {
    this.particles.forEach((particle) => {
      particle.draw(context);
      particle.update();
    });
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
    super({
      canvas,
      context,
      plugins: [LineDrawer, Connector],
      colorStops: ['white', 'gold'],
    });
  }
}

class BubbleEffect extends Effect {
  constructor(canvas, context) {
    super({
      canvas,
      context,
      plugins: [],
      colorStops: ['red', 'magenta', 'blue', 'green', 'yellow'],
    });
  }
}

const effects = [
  new SunriseEffect(canvas, ctx),
  new BubbleEffect(canvas, ctx),
];
let effectIndex = 0;
let effect = effects[effectIndex];

const updateEvents = () => {
  window.onresize = () => effect.resize(window.innerWidth, window.innerHeight);
  window.onmousemove = (event) => {
    if (effect.mouse.pressed) effect.assignMouseCordinate(event);
  };
  window.onmousedown = (event) => {
    effect.mouse.pressed = true;
    effect.assignMouseCordinate(event);
  };
  window.onmouseup = () => {
    effect.mouse.pressed = false;
  };
  effect.initCtx();
};
// Initialize events
updateEvents();

document.addEventListener('contextmenu', (e) => {
  effectIndex = (effectIndex + 1) % effects.length;
  effect = effects[effectIndex];
  // Update event listeners to use the new effect
  updateEvents();
  // Prevent default context menu from appearing
  e.preventDefault();
});

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  effect.handleParticles(ctx);
  requestAnimationFrame(animate);
}
animate();
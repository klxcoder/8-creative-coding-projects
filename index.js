const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Particle Class with Plugin Support
class Particle {
  constructor({
    effect,
    index,
    plugins = [],
    dv,
  }) {
    this.effect = effect;
    this.index = index;
    this.radius = getRandomInt(4, 15);
    this.reset();
    this.vx = Math.random() * 2 * dv - dv;
    this.vy = Math.random() * 2 * dv - dv;
    this.plugins = plugins;
  }
  draw(context) {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fill();
    this.plugins.forEach(plugin => plugin.draw(this, context));
  }
  update() {
  }
  reset() {
    this.x = this.radius + getRandomInt(0, this.effect.width - this.radius * 2);
    this.y = this.radius + getRandomInt(0, this.effect.height - this.radius * 2);
  }
}

class SunriseParticle extends Particle {
  constructor({
    effect,
    index,
    plugins = [],
    dv,
  }) {
    super({
      effect,
      index,
      plugins,
      dv,
    });
    this.pushX = 0;
    this.pushY = 0;
    this.friction = 0.8;
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
}

class BubbleParticle extends Particle {
  constructor({
    effect,
    index,
    plugins = [],
    dv,
  }) {
    super({
      effect,
      index,
      plugins,
      dv,
    });
    this.minRadius = this.radius;
    this.maxRadius = this.radius * 5;
  }
  update() {
    if (this.effect.mouse.pressed) {
      const dx = this.x - this.effect.mouse.x;
      const dy = this.y - this.effect.mouse.y;
      const distance = Math.hypot(dy, dx);
      if (distance < this.effect.mouse.radius && this.radius < this.maxRadius) {
        this.radius += 2;
      }
    }
    if (this.radius > this.minRadius) {
      this.radius -= 0.1;
    }
    this.x += this.vx;
    this.y += this.vy;
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
}

class StarParticle extends Particle {
  constructor({
    effect,
    index,
    plugins = [],
    dv,
  }) {
    super({
      effect,
      index,
      plugins,
      dv,
    });
    this.pushX = 0;
    this.pushY = 0;
    this.friction = 0.8;
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

const Border = {
  draw(particle, context) {
    context.save();
    context.strokeStyle = 'black';
    context.stroke();
    context.restore();
  }
}

const Reflection = {
  draw(particle, context) {
    context.save();
    context.fillStyle = 'white';
    context.beginPath();
    context.arc(particle.x - particle.radius * 0.2, particle.y - particle.radius * 0.3, particle.radius * 0.6, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
}

const Star = {
  image: document.getElementById('stars_sprite'),
  draw(particle, context) {
    console.log('Here image = ', this.image);
    context.save();
    context.fillStyle = 'white';
    context.beginPath();
    context.arc(particle.x - particle.radius * 0.2, particle.y - particle.radius * 0.3, particle.radius * 0.6, 0, Math.PI * 2);
    context.drawImage(this.image, particle.x, particle.y);
    context.fill();
    context.restore();
  }
}

class Effect {
  constructor({
    canvas,
    context,
    plugins = [],
    colorStops = [],
    dv,
    particleClass,
    radius,
    numberOfParticles,
  }) {
    this.canvas = canvas;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.context = context;
    this.particles = [];
    this.plugins = plugins;
    this.colorStops = colorStops;
    this.dv = dv;
    this.particleClass = particleClass;
    this.numberOfParticles = numberOfParticles;
    this.initCtx();
    this.createParticles();

    this.mouse = {
      x: 0,
      y: 0,
      pressed: false,
      radius: radius,
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
      this.particles.push(new this.particleClass({
        effect: this,
        index: i,
        plugins: this.plugins,
        dv: this.dv,
      }));
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
      dv: 1,
      particleClass: SunriseParticle,
      radius: 150,
      numberOfParticles: 200,
    });
  }
}

class BubbleEffect extends Effect {
  constructor(canvas, context) {
    super({
      canvas,
      context,
      plugins: [Border, Reflection],
      colorStops: ['red', 'magenta'],
      dv: 0.2,
      particleClass: BubbleParticle,
      radius: 60,
      numberOfParticles: 300,
    });
  }
}

class StarEffect extends Effect {
  constructor(canvas, context) {
    super({
      canvas,
      context,
      plugins: [Border, Star],
      colorStops: ['white', 'black'],
      dv: 0.2,
      particleClass: StarParticle,
      radius: 60,
      numberOfParticles: 10,
    });
  }
}

const updateEvents = (effect) => {
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

window.addEventListener('load', () => {
  // setup
  const canvas = document.getElementById('canvas1');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const effects = [
    new StarEffect(canvas, ctx),
    new SunriseEffect(canvas, ctx),
    new BubbleEffect(canvas, ctx),
  ];
  let effectIndex = 0;
  let effect = effects[effectIndex];
  //
  document.addEventListener('contextmenu', (e) => {
    effectIndex = (effectIndex + 1) % effects.length;
    effect = effects[effectIndex];
    // Update event listeners to use the new effect
    updateEvents(effect);
    // Prevent default context menu from appearing
    e.preventDefault();
  });
  // Initialize events
  updateEvents(effect);
  //
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    effect.handleParticles(ctx);
    requestAnimationFrame(animate);
  }
  animate();
});
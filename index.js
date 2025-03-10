const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Particle Class with Plugin Support
class Particle {
  constructor({
    effect,
    index,
    plugins = [],
    dv,
    radiusFrom,
    radiusTo,
  }) {
    this.effect = effect;
    this.index = index;
    this.dv = dv;
    this.radius = getRandomInt(radiusFrom, radiusTo);
    this.reset();
    this.plugins = plugins;
  }
  draw(context) {
    this.plugins.forEach(plugin => plugin.draw(this, context));
  }
  update() {
  }
  reset() {
    this.x = this.radius + getRandomInt(0, this.effect.width - this.radius * 2);
    this.y = this.radius + getRandomInt(0, this.effect.height - this.radius * 2);
    this.vx = Math.random() * 2 * this.dv - this.dv;
    this.vy = Math.random() * 2 * this.dv - this.dv;
  }
}

class SunriseParticle extends Particle {
  constructor(config) {
    super(config);
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
  constructor(config) {
    super(config);
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

class StarParticle extends SunriseParticle {
  constructor(config) {
    super(config);
    this.friction = 0.6;
    this.width = this.height = 50 * (Math.random() * 0.8 + 0.2);
    this.frameX = getRandomInt(0, 2);
    this.frameY = getRandomInt(0, 2);
  }
}

class GravityParticle extends Particle {
  constructor(config) {
    super(config);
    this.gravity = this.radius * 0.005;
  }
  update() {
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < this.radius) {
      this.x = this.radius;
      this.vx *= -1;
    } else if (this.x > this.effect.width - this.radius) {
      this.x = this.effect.width - this.radius;
      this.vx *= -1;
    }
    if (this.y > this.effect.height - this.radius) {
      // Will bounce to the ground
      // this.y = this.effect.height - this.radius;
      // this.vy *= -0.6;
      // Will reset
      this.reset();
    }
    const particleRect = {
      x: this.x - this.radius,
      y: this.y - this.radius,
      w: 2 * this.radius,
      h: 2 * this.radius,
    }
    // https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
    if (
      particleRect.x < this.effect.textRect.x + this.effect.textRect.w &&
      particleRect.x + particleRect.w > this.effect.textRect.x &&
      particleRect.y < this.effect.textRect.y + this.effect.textRect.h &&
      particleRect.y + particleRect.h > this.effect.textRect.y
    ) {
      // Collision detected!
      this.vy = -Math.abs(this.vy); // make it all way bound up
      this.vx *= 1.1; // make it bounce faster in horizontal direction
    }
    this.effect.context.strokeRect(
      particleRect.x,
      particleRect.y,
      particleRect.w,
      particleRect.h,
    );
    this.effect.context.strokeRect(
      this.effect.textRect.x,
      this.effect.textRect.y,
      this.effect.textRect.w,
      this.effect.textRect.h,
    );
  }
  reset() {
    super.reset();
    this.y = -this.radius - Math.random() * this.effect.height * 0.5;
    this.vy = 0;
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

const CircleFill = {
  draw(particle, context) {
    context.beginPath();
    context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    context.fill();
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
    context.save();
    context.fillStyle = 'white';
    context.beginPath();
    context.drawImage(this.image, 50 * particle.frameX, 50 * particle.frameY, 50, 50, particle.x - particle.radius, particle.y - particle.radius, 2 * particle.radius, 2 * particle.radius);
    context.fill();
    context.restore();
  }
}

class Effect {
  constructor({
    canvas,
    context,
    plugins = [],
    backgroundColorStops = [],
    particleColorStops = [],
    dv,
    particleClass,
    radius,
    numberOfParticles,
    radiusFrom,
    radiusTo,
    text,
  }) {
    this.canvas = canvas;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.context = context;
    this.particles = [];
    this.plugins = plugins;
    this.backgroundColorStops = backgroundColorStops;
    this.particleColorStops = particleColorStops;
    this.dv = dv;
    this.particleClass = particleClass;
    this.numberOfParticles = numberOfParticles;
    this.radiusFrom = radiusFrom;
    this.radiusTo = radiusTo;
    this.text = text;
    this.backgroundCanvas = this.getBackgroundCanvas();
    this.textRect = this.getTextRect();
    this.initCtx();
    this.createParticles();

    this.mouse = {
      x: 0,
      y: 0,
      pressed: false,
      radius: radius,
    }
  }
  getBackgroundCanvas() {
    //
    const backgroundCanvas = document.createElement('canvas');
    //
    backgroundCanvas.width = this.canvas.width;
    backgroundCanvas.height = this.canvas.height;
    //
    const backgroundCtx = backgroundCanvas.getContext('2d');
    //
    const gradient = backgroundCtx.createLinearGradient(0, 0, 0, this.canvas.height);
    this.backgroundColorStops.forEach((colorStop, index) => gradient.addColorStop(index / (this.particleColorStops.length - 1), colorStop));
    backgroundCtx.fillStyle = gradient;
    //
    backgroundCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    //
    return backgroundCanvas;
  }
  getTextRect() {
    const textWidth = this.context.measureText(this.text).width;
    const textHeight = 40; // Approximate from font size
    const textRect = {
      x: this.canvas.width / 2 - textWidth / 2 - 6,
      y: this.canvas.height / 2 - textHeight / 2 - 6,
      w: textWidth + 10,
      h: textHeight + 10
    }
    return textRect;
  }
  initCtx() {
    const gradient = this.context.createLinearGradient(0, 0, 0, this.canvas.height);
    this.particleColorStops.forEach((colorStop, index) => gradient.addColorStop(index / (this.particleColorStops.length - 1), colorStop));
    this.context.fillStyle = gradient;
    this.context.strokeStyle = gradient;
    this.context.font = "bold 40px sans-serif";
    this.context.textAlign = "center"; // Center horizontally
    this.context.textBaseline = "middle"; // Center vertically
    this.backgroundCanvas = this.getBackgroundCanvas();
    this.textRect = this.getTextRect();
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
        radiusFrom: this.radiusFrom,
        radiusTo: this.radiusTo,
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
      plugins: [CircleFill, LineDrawer, Connector],
      backgroundColorStops: ['darkblue', 'lightblue'],
      particleColorStops: ['white', 'gold'],
      dv: 1,
      particleClass: SunriseParticle,
      radius: 150,
      numberOfParticles: 200,
      radiusFrom: 4,
      radiusTo: 15,
    });
  }
}

class BubbleEffect extends Effect {
  constructor(canvas, context) {
    super({
      canvas,
      context,
      plugins: [CircleFill, Border, Reflection],
      backgroundColorStops: ['lightblue', 'darkblue'],
      particleColorStops: ['red', 'magenta'],
      dv: 0.2,
      particleClass: BubbleParticle,
      radius: 60,
      numberOfParticles: 300,
      radiusFrom: 4,
      radiusTo: 15,
    });
  }
}

class StarEffect extends Effect {
  constructor(canvas, context) {
    super({
      canvas,
      context,
      plugins: [Star],
      backgroundColorStops: ['black', 'black'],
      particleColorStops: ['white', 'white'],
      dv: 0.2,
      particleClass: StarParticle,
      radius: 60,
      numberOfParticles: 500,
      radiusFrom: 4,
      radiusTo: 15,
    });
  }
}

class LiquidEffect extends Effect {
  constructor(canvas, context) {
    super({
      canvas,
      context,
      plugins: [CircleFill, LineDrawer, Connector],
      backgroundColorStops: ['black', 'black'],
      particleColorStops: ['white', 'white'],
      dv: 1,
      particleClass: SunriseParticle,
      radius: 150,
      numberOfParticles: 200,
      radiusFrom: 20,
      radiusTo: 40,
    });
  }
}

class GravityEffect extends Effect {
  constructor(canvas, context, text) {
    super({
      canvas,
      context,
      plugins: [CircleFill, Connector],
      backgroundColorStops: ['black', 'black'],
      particleColorStops: ['white', 'white'],
      dv: 1,
      particleClass: GravityParticle,
      radius: 150,
      numberOfParticles: 200,
      radiusFrom: 5,
      radiusTo: 10,
      text,
    });
  }
}

const updateEvents = (effect, liquid, canvas) => {
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
  if (liquid) {
    canvas.classList.add('liquid');
  } else {
    canvas.classList.remove('liquid');
  }
};

window.addEventListener('load', () => {
  // setup
  const canvas = document.getElementById('canvas1');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  //
  const text = "@KLXCODER - Learn to code";

  const effects = [
    new GravityEffect(canvas, ctx, text),
    new LiquidEffect(canvas, ctx), // => liquidIndex
    new SunriseEffect(canvas, ctx),
    new BubbleEffect(canvas, ctx),
    new StarEffect(canvas, ctx),
  ];
  let effectIndex = 0;
  let liquidIndex = 1;
  let effect = effects[effectIndex];
  //
  document.addEventListener('contextmenu', (e) => {
    effectIndex = (effectIndex + 1) % effects.length;
    effect = effects[effectIndex];
    // Update event listeners to use the new effect
    updateEvents(effect, effectIndex === liquidIndex, canvas);
    // Prevent default context menu from appearing
    e.preventDefault();
  });
  // Initialize events
  updateEvents(effect, effectIndex === liquidIndex, canvas);
  //
  function animate() {
    ctx.drawImage(effect.backgroundCanvas, 0, 0);
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    effect.handleParticles(ctx);
    requestAnimationFrame(animate);
  }
  animate();
});
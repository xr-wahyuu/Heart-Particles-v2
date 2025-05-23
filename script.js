// Configuration
const config = {
  particleCount: 32,
  speed: 1,
  colorScheme: "rainbow",
  mouseInfluence: 50,
  showHeartOutline: true,
  particleSize: 10,
};

// Canvas setup
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
let canvasWidth = (canvas.width = window.innerWidth);
let canvasHeight = (canvas.height = window.innerHeight);

// Animation state
let trails = [];
let heartPath = [];
let mouseX = canvasWidth / 2;
let mouseY = canvasHeight / 2;
let mouseActive = false;
let animationRunning = false;

// Initialize heart path points (fixed formula)
function initHeartPath() {
  heartPath = [];
  const PI2 = 6.28318; // 2*PI approximation
  const steps = Math.max(32, config.particleCount);

  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * PI2;
    heartPath.push([
      canvasWidth / 2 + 180 * Math.pow(Math.sin(t), 3),
      canvasHeight / 2 +
        10 *
          (-(15 * Math.cos(t) -
            5 * Math.cos(2 * t) -
            2 * Math.cos(3 * t) -
            Math.cos(4 * t))),
    ]);
  }
}

// Initialize particles
function initParticles() {
  trails = [];
  if (heartPath.length === 0) initHeartPath();

  for (let i = 0; i < config.particleCount; i++) {
    const particles = [];
    const x = Math.random() * canvasWidth;
    const y = Math.random() * canvasHeight;

    for (let k = 0; k < config.particleCount; k++) {
      // Color generation
      let hue,
        saturation = Math.random() * 40 + 60;
      let brightness = Math.random() * 60 + 20;

      switch (config.colorScheme) {
        case "red":
          hue = Math.random() * 20 + 350;
          break;
        case "blue":
          hue = Math.random() * 20 + 200;
          break;
        case "green":
          hue = Math.random() * 20 + 100;
          break;
        case "monochrome":
          hue = 0;
          saturation = 0;
          break;
        default:
          hue = (i / config.particleCount) * 360; // rainbow
      }

      particles.push({
        x,
        y,
        velX: 0,
        velY: 0,
        radius: ((1 - k / config.particleCount) + 1) * (config.particleSize / 2),
        speed: Math.random() + 1,
        targetIndex: Math.floor(Math.random() * heartPath.length),
        direction: (i % 2) * 2 - 1,
        friction: Math.random() * 0.2 + 0.7,
        color: `hsla(${hue},${saturation}%,${brightness}%,0.1)`,
      });
    }
    trails.push(particles);
  }
}

// Render a single particle
function renderParticle(particle) {
  ctx.fillStyle = particle.color;
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
  ctx.fill();
}

// Main animation loop
function animationLoop() {
  if (!animationRunning) return;

  try {
    // Clear with trail effect
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    trails.forEach((trail) => {
      if (!trail || !trail.length) return;

      const leader = trail[0];
      const target = heartPath[leader.targetIndex % heartPath.length];
      if (!target) return;

      // Mouse influence
      if (mouseActive && config.mouseInfluence > 0) {
        const dx = mouseX - leader.x;
        const dy = mouseY - leader.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 300) {
          const force = (1 - dist / 300) * (config.mouseInfluence / 20);
          leader.velX += (dx / dist) * force;
          leader.velY += (dy / dist) * force;
        }
      }

      // Move toward target
      const dx = leader.x - target[0];
      const dy = leader.y - target[1];
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 10) {
        if (Math.random() > 0.95) {
          leader.targetIndex = Math.floor(Math.random() * heartPath.length);
        } else {
          if (Math.random() > 0.99) leader.direction *= -1;
          leader.targetIndex += leader.direction;
          leader.targetIndex = (leader.targetIndex + heartPath.length) % heartPath.length;
        }
      }

      // Update physics
      leader.velX += (-dx / dist) * leader.speed * config.speed;
      leader.velY += (-dy / dist) * leader.speed * config.speed;
      leader.x += leader.velX;
      leader.y += leader.velY;
      leader.velX *= leader.friction;
      leader.velY *= leader.friction;

      // Render trail
      renderParticle(leader);
      for (let k = 1; k < trail.length; k++) {
        trail[k].x -= (trail[k].x - trail[k - 1].x) * 0.7;
        trail[k].y -= (trail[k].y - trail[k - 1].y) * 0.7;
        renderParticle(trail[k]);
      }
    });
  } catch (error) {
    console.error("Animation error:", error);
  }

  requestAnimationFrame(animationLoop);
}

// Control handlers
function setupControls() {
  const controls = document.getElementById("controls");
  let controlsVisible = true;

  document.getElementById("toggle-controls").addEventListener("click", () => {
    controlsVisible = !controlsVisible;
    controls.style.display = controlsVisible ? "block" : "none";
  });

  document.getElementById("toggle-fullscreen").addEventListener("click", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  });

  const updateParticles = () => {
    config.particleCount = Math.min(
      100,
      Math.max(10, parseInt(document.getElementById("particleCount").value))
    );
    document.getElementById("particleCountValue").textContent = config.particleCount;
    initHeartPath();
    initParticles();
  };

  document.getElementById("particleCount").addEventListener("input", () => {
    updateParticles();
  });

  const updateSize = () => {
    config.particleSize = parseInt(document.getElementById("particleSize").value);
    document.getElementById("particleSizeValue").textContent = config.particleSize;
    initParticles();
  };

  document.getElementById("particleSize").addEventListener("input", updateSize);

  document.getElementById("speed").addEventListener("input", (e) => {
    config.speed = parseFloat(e.target.value);
    document.getElementById("speedValue").textContent = config.speed;
  });

  document.getElementById("mouseInfluence").addEventListener("input", (e) => {
    config.mouseInfluence = parseInt(e.target.value);
    document.getElementById("mouseInfluenceValue").textContent = config.mouseInfluence;
  });

  document.getElementById("colorScheme").addEventListener("change", (e) => {
    config.colorScheme = e.target.value;
    initParticles();
  });
}

// Resize handler
window.addEventListener("resize", () => {
  canvasWidth = canvas.width = window.innerWidth;
  canvasHeight = canvas.height = window.innerHeight;
  initHeartPath();
  initParticles();
});

// Mouse tracking
window.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  mouseActive = true;
});
window.addEventListener("mouseleave", () => {
  mouseActive = false;
});

// Initialization
function start() {
  initHeartPath();
  initParticles();
  animationRunning = true;
  animationLoop();
  setupControls();
}

start();

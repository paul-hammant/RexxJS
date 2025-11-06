import * as d3 from 'd3';
import { EtchASketch } from './etch-a-sketch.js';
import { ControlBusAdapter } from './control-bus-adapter.js';

// Wait for RexxJS to load
function waitForRexxJS() {
  return new Promise((resolve) => {
    if (window.RexxInterpreter && window.parse) {
      resolve();
    } else {
      const checkInterval = setInterval(() => {
        if (window.RexxInterpreter && window.parse) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    }
  });
}

async function main() {
  console.log('Rexx-A-Sketch initializing...');

  // Wait for RexxJS to be available
  await waitForRexxJS();
  console.log('RexxJS loaded successfully');

  // Initialize etch-a-sketch
  const etch = new EtchASketch('#canvas');

  // Initialize control bus adapter
  const controlBus = new ControlBusAdapter(etch);

  // Connect dials to etch-a-sketch
  const dialX = document.getElementById('dialX');
  const dialY = document.getElementById('dialY');
  const dialXValue = document.getElementById('dialX-value');
  const dialYValue = document.getElementById('dialY-value');

  let lastUpdateTime = 0;
  const UPDATE_INTERVAL = 16; // ~60 FPS

  function updatePosition() {
    const now = Date.now();
    if (now - lastUpdateTime < UPDATE_INTERVAL) return;
    lastUpdateTime = now;

    const dx = parseFloat(dialX.value);
    const dy = parseFloat(dialY.value);

    if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
      etch.move(dx, dy);
    }

    // Update position display
    const pos = etch.getPosition();
    document.getElementById('posX').textContent = pos.x.toFixed(1);
    document.getElementById('posY').textContent = pos.y.toFixed(1);
  }

  dialX.addEventListener('input', (e) => {
    dialXValue.textContent = parseFloat(e.target.value).toFixed(1);
    updatePosition();
  });

  dialY.addEventListener('input', (e) => {
    dialYValue.textContent = parseFloat(e.target.value).toFixed(1);
    updatePosition();
  });

  // Clear button
  document.getElementById('clearBtn').addEventListener('click', () => {
    etch.clear();
    dialX.value = 0;
    dialY.value = 0;
    dialXValue.textContent = '0';
    dialYValue.textContent = '0';
  });

  // Draw stick figure button
  document.getElementById('drawStickFigureBtn').addEventListener('click', async () => {
    console.log('Drawing stick figure...');
    await etch.drawStickFigure();
    console.log('Stick figure complete! (Ding!)');
  });

  // Start control bus polling
  controlBus.startPolling();

  // Update control bus status
  function updateBusStatus() {
    const statusEl = document.getElementById('busStatus');
    if (controlBus.isConnected()) {
      statusEl.textContent = 'Connected';
      statusEl.className = 'connected';
    } else {
      statusEl.textContent = 'Disconnected';
      statusEl.className = 'disconnected';
    }
  }

  setInterval(updateBusStatus, 1000);
  updateBusStatus();

  console.log('Rexx-A-Sketch ready! Hey, Etch. Draw!');
}

// Start the application
main().catch(console.error);

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

  // Connect knobs to etch-a-sketch
  const knobX = document.getElementById('knobX');
  const knobY = document.getElementById('knobY');
  const knobXValue = document.getElementById('knobX-value');
  const knobYValue = document.getElementById('knobY-value');

  // Knob state
  let knobXAngle = 0; // degrees
  let knobYAngle = 0; // degrees
  let isDraggingX = false;
  let isDraggingY = false;

  // Setup knob rotation
  function setupKnob(svg, onRotate) {
    const indicator = svg.querySelector('.knob-indicator');
    const dot = svg.querySelector('.knob-dot');
    let isDragging = false;
    let currentAngle = 0;

    function getAngle(clientX, clientY) {
      const rect = svg.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      return Math.atan2(dy, dx) * (180 / Math.PI) + 90; // 0 degrees at top
    }

    function updateRotation(angle) {
      currentAngle = angle;
      const transform = `rotate(${angle} 50 50)`;
      indicator.setAttribute('transform', transform);
      dot.setAttribute('transform', transform);
      onRotate(angle);
    }

    function handleMouseDown(e) {
      isDragging = true;
      e.preventDefault();
    }

    function handleMouseMove(e) {
      if (!isDragging) return;
      const angle = getAngle(e.clientX, e.clientY);
      updateRotation(angle);
    }

    function handleMouseUp() {
      isDragging = false;
    }

    svg.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Touch support
    svg.addEventListener('touchstart', (e) => {
      isDragging = true;
      e.preventDefault();
    });

    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      const angle = getAngle(touch.clientX, touch.clientY);
      updateRotation(angle);
    });

    document.addEventListener('touchend', () => {
      isDragging = false;
    });

    return {
      getAngle: () => currentAngle,
      setAngle: (angle) => updateRotation(angle)
    };
  }

  const knobXController = setupKnob(knobX, (angle) => {
    knobXAngle = angle;
    knobXValue.textContent = `${Math.round(angle)}°`;
  });

  const knobYController = setupKnob(knobY, (angle) => {
    knobYAngle = angle;
    knobYValue.textContent = `${Math.round(angle)}°`;
  });

  // Continuous movement based on knob angles
  let lastUpdateTime = 0;
  const UPDATE_INTERVAL = 16; // ~60 FPS

  function updatePosition() {
    const now = Date.now();
    if (now - lastUpdateTime < UPDATE_INTERVAL) return;
    lastUpdateTime = now;

    // Convert angle to speed (-180 to 180 degrees)
    // Normalize to -180 to 180 range
    let normalizedX = ((knobXAngle + 180) % 360) - 180;
    let normalizedY = ((knobYAngle + 180) % 360) - 180;

    // Map angle to movement speed (-5 to +5)
    const maxSpeed = 5;
    const dx = (normalizedX / 180) * maxSpeed;
    const dy = (normalizedY / 180) * maxSpeed;

    if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
      etch.move(dx, dy);
    }

    // Update position display
    const pos = etch.getPosition();
    document.getElementById('posX').textContent = pos.x.toFixed(1);
    document.getElementById('posY').textContent = pos.y.toFixed(1);

    requestAnimationFrame(updatePosition);
  }

  // Start animation loop
  requestAnimationFrame(updatePosition);

  // Clear button
  document.getElementById('clearBtn').addEventListener('click', () => {
    etch.clear();
    knobXController.setAngle(0);
    knobYController.setAngle(0);
    knobXAngle = 0;
    knobYAngle = 0;
    knobXValue.textContent = '0°';
    knobYValue.textContent = '0°';
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

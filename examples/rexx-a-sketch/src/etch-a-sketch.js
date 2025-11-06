import * as d3 from 'd3';

export class EtchASketch {
  constructor(selector) {
    this.svg = d3.select(selector);
    this.width = parseInt(this.svg.attr('width'));
    this.height = parseInt(this.svg.attr('height'));

    // Current position (center of canvas)
    this.x = this.width / 2;
    this.y = this.height / 2;

    // Drawing state
    this.isDrawing = true;
    this.path = [];
    this.pathElements = [];

    // Create drawing group
    this.group = this.svg.append('g');

    console.log('EtchASketch initialized at', this.x, this.y);
  }

  clear() {
    this.group.selectAll('*').remove();
    this.x = this.width / 2;
    this.y = this.height / 2;
    this.path = [];
    this.pathElements = [];
    console.log('Canvas cleared');
  }

  getPosition() {
    return { x: this.x, y: this.y };
  }

  setPosition(x, y) {
    this.x = Math.max(0, Math.min(this.width, x));
    this.y = Math.max(0, Math.min(this.height, y));
  }

  move(dx, dy) {
    const oldX = this.x;
    const oldY = this.y;

    this.x += dx;
    this.y += dy;

    // Clamp to canvas bounds
    this.x = Math.max(0, Math.min(this.width, this.x));
    this.y = Math.max(0, Math.min(this.height, this.y));

    // Draw line if position changed
    if (this.isDrawing && (oldX !== this.x || oldY !== this.y)) {
      this.drawLine(oldX, oldY, this.x, this.y);
    }
  }

  moveTo(x, y) {
    const oldX = this.x;
    const oldY = this.y;
    this.setPosition(x, y);

    if (this.isDrawing && (oldX !== this.x || oldY !== this.y)) {
      this.drawLine(oldX, oldY, this.x, this.y);
    }
  }

  drawLine(x1, y1, x2, y2) {
    const line = this.group.append('line')
      .attr('x1', x1)
      .attr('y1', y1)
      .attr('x2', x2)
      .attr('y2', y2)
      .attr('stroke', '#333')
      .attr('stroke-width', 2)
      .attr('stroke-linecap', 'round');

    this.pathElements.push(line);
  }

  penUp() {
    this.isDrawing = false;
  }

  penDown() {
    this.isDrawing = true;
  }

  // Draw a stick figure (Toy Story style - rapid drawing)
  async drawStickFigure() {
    this.clear();

    // Start at top center for head
    const centerX = this.width / 2;
    const startY = 100;

    // Helper function to draw with animation delay
    const drawWithDelay = (commands, delayMs = 5) => {
      return new Promise((resolve) => {
        let index = 0;
        const drawNext = () => {
          if (index >= commands.length) {
            resolve();
            return;
          }

          const cmd = commands[index];
          cmd();
          index++;
          setTimeout(drawNext, delayMs);
        };
        drawNext();
      });
    };

    // Define drawing sequence
    const commands = [];

    // Draw head (circle using lines)
    const headRadius = 30;
    const headSteps = 20;
    for (let i = 0; i <= headSteps; i++) {
      const angle1 = (i / headSteps) * Math.PI * 2;
      const angle2 = ((i + 1) / headSteps) * Math.PI * 2;
      const x1 = centerX + Math.cos(angle1) * headRadius;
      const y1 = startY + Math.sin(angle1) * headRadius;
      const x2 = centerX + Math.cos(angle2) * headRadius;
      const y2 = startY + Math.sin(angle2) * headRadius;

      commands.push(() => {
        this.setPosition(x1, y1);
        this.moveTo(x2, y2);
      });
    }

    // Move to neck (pen up)
    commands.push(() => {
      this.penUp();
      this.setPosition(centerX, startY + headRadius);
    });

    // Draw body (straight down)
    commands.push(() => {
      this.penDown();
      this.moveTo(centerX, startY + headRadius + 80);
    });

    // Draw left arm
    commands.push(() => {
      this.penUp();
      this.setPosition(centerX, startY + headRadius + 20);
      this.penDown();
      this.moveTo(centerX - 40, startY + headRadius + 40);
    });

    // Draw right arm
    commands.push(() => {
      this.penUp();
      this.setPosition(centerX, startY + headRadius + 20);
      this.penDown();
      this.moveTo(centerX + 40, startY + headRadius + 40);
    });

    // Draw left leg
    commands.push(() => {
      this.penUp();
      this.setPosition(centerX, startY + headRadius + 80);
      this.penDown();
      this.moveTo(centerX - 30, startY + headRadius + 140);
    });

    // Draw right leg
    commands.push(() => {
      this.penUp();
      this.setPosition(centerX, startY + headRadius + 80);
      this.penDown();
      this.moveTo(centerX + 30, startY + headRadius + 140);
    });

    // Execute all commands with slight delay
    await drawWithDelay(commands, 3);

    // Make a "ding" sound effect by briefly highlighting
    this.group.selectAll('line')
      .transition()
      .duration(100)
      .attr('stroke', '#ff6b6b')
      .transition()
      .duration(100)
      .attr('stroke', '#333');

    console.log('Ding! Stick figure complete.');
  }
}

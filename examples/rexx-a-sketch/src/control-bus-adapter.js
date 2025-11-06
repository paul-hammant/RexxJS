/**
 * Control Bus Adapter - Handles Rexx-over-wire communication
 * Polls the Tauri backend for commands and executes them
 */
export class ControlBusAdapter {
  constructor(etchASketch) {
    this.etch = etchASketch;
    this.polling = false;
    this.pollInterval = 500; // Poll every 500ms
    this.apiUrl = 'http://localhost:8084';
    this.authToken = 'dev-token-12345';
    this.connected = false;

    // Register Rexx commands
    this.setupRexxCommands();
  }

  setupRexxCommands() {
    // Create a RexxJS interpreter for executing commands
    this.interpreter = new window.RexxInterpreter();

    // Register etch-a-sketch commands as functions
    const commands = {
      MOVE: (dx, dy) => {
        this.etch.move(parseFloat(dx), parseFloat(dy));
        return { success: true, position: this.etch.getPosition() };
      },

      MOVE_TO: (x, y) => {
        this.etch.moveTo(parseFloat(x), parseFloat(y));
        return { success: true, position: this.etch.getPosition() };
      },

      PEN_UP: () => {
        this.etch.penUp();
        return { success: true };
      },

      PEN_DOWN: () => {
        this.etch.penDown();
        return { success: true };
      },

      CLEAR: () => {
        this.etch.clear();
        return { success: true };
      },

      GET_POSITION: () => {
        return { success: true, position: this.etch.getPosition() };
      },

      DRAW_STICK_FIGURE: async () => {
        await this.etch.drawStickFigure();
        return { success: true };
      },

      DRAW_LINE: (x1, y1, x2, y2) => {
        this.etch.drawLine(
          parseFloat(x1),
          parseFloat(y1),
          parseFloat(x2),
          parseFloat(y2)
        );
        return { success: true };
      }
    };

    // Register each command as a global function for RexxJS
    for (const [name, fn] of Object.entries(commands)) {
      window[name] = fn;
    }
  }

  async startPolling() {
    if (this.polling) return;

    this.polling = true;
    console.log('Control Bus: Starting polling...');

    while (this.polling) {
      try {
        await this.poll();
        await this.sleep(this.pollInterval);
      } catch (error) {
        console.error('Control Bus polling error:', error);
        this.connected = false;
        await this.sleep(this.pollInterval * 2);
      }
    }
  }

  stopPolling() {
    this.polling = false;
    this.connected = false;
  }

  async poll() {
    try {
      const response = await fetch(`${this.apiUrl}/api/poll`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        this.connected = false;
        return;
      }

      this.connected = true;
      const command = await response.json();

      if (command && command.request_id) {
        console.log('Control Bus: Received command:', command.command);
        await this.executeCommand(command);
      }
    } catch (error) {
      // Network error - backend not running
      this.connected = false;
    }
  }

  async executeCommand(command) {
    try {
      // Parse and execute the Rexx command
      const script = command.command;
      const parsed = window.parse(script);

      // Execute the script
      const result = await this.interpreter.run(parsed);

      // Send result back to backend
      await this.sendResult(command.request_id, {
        success: true,
        result: result
      });

      console.log('Control Bus: Command executed successfully');
    } catch (error) {
      console.error('Control Bus: Command execution error:', error);

      // Send error back to backend
      await this.sendResult(command.request_id, {
        success: false,
        error: error.message
      });
    }
  }

  async sendResult(requestId, result) {
    try {
      const response = await fetch(`${this.apiUrl}/api/result`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request_id: requestId,
          result: result
        })
      });

      if (!response.ok) {
        console.error('Control Bus: Failed to send result');
      }
    } catch (error) {
      console.error('Control Bus: Error sending result:', error);
    }
  }

  isConnected() {
    return this.connected;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

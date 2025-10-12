// Terminal functionality
document.addEventListener('DOMContentLoaded', function() {
    const terminalInput = document.getElementById('terminal-input');
    const terminalOutput = document.getElementById('terminal-output');
    const cursor = document.querySelector('.cursor');

    let commandHistory = [];
    let historyIndex = -1;
    let currentCommand = '';

    // Predefined commands
    const commands = {
        help: {
            description: 'Show available commands',
            execute: function() {
                return `Available commands:
  help     - Show this help message
  ls       - List directory contents
  pwd      - Print working directory
  echo     - Display a line of text
  clear    - Clear the terminal screen
  date     - Display the current date and time
  whoami   - Display current user
  uname    - Display system information
  history  - Show command history`;
            }
        },
        ls: {
            description: 'List directory contents',
            execute: function() {
                return `applications/  databases/  cache/  config/`;
            }
        },
        pwd: {
            description: 'Print working directory',
            execute: function() {
                return '/home/user/unhazzle-project';
            }
        },
        echo: {
            description: 'Display a line of text',
            execute: function(args) {
                return args.join(' ') || '';
            }
        },
        clear: {
            description: 'Clear the terminal screen',
            execute: function() {
                terminalOutput.innerHTML = '';
                return '';
            }
        },
        date: {
            description: 'Display the current date and time',
            execute: function() {
                return new Date().toString();
            }
        },
        whoami: {
            description: 'Display current user',
            execute: function() {
                return 'unhazzle-user';
            }
        },
        uname: {
            description: 'Display system information',
            execute: function() {
                return 'Unhazzle Infrastructure Platform v1.0.0';
            }
        },
        history: {
            description: 'Show command history',
            execute: function() {
                if (commandHistory.length === 0) {
                    return 'No commands in history';
                }
                return commandHistory.map((cmd, index) => `${index + 1}  ${cmd}`).join('\n');
            }
        }
    };

    // Function to add output to terminal
    function addOutput(text) {
        if (text) {
            const line = document.createElement('div');
            line.className = 'terminal-line';
            line.textContent = text;
            terminalOutput.appendChild(line);
            terminalOutput.scrollTop = terminalOutput.scrollHeight;
        }
    }

    // Function to display welcome message
    function displayWelcome() {
        const welcomeMessage = `
   ____  __  __  ____  _     _____ _   _ _____
  / __ \\|  \\/  |/ __ \\| |   | ____| \\ | | ____|
 | |  | | \\  / | |  | | |   |  _| |  \\| |  _|
 | |  | | |\\/| | |  | | |___| |___| |\\  | |___|
 | |__| | |  | | |__| |_____|_____|_| \\_|_____|
  \\____/|_|  |_|\\____/|_____|_____|_|  |_|_____|

Welcome to Unhazzle Terminal v1.0.0
Infrastructure management made simple.

Type 'help' to see available commands.
Type 'clear' to clear the screen.

`;
        addOutput(welcomeMessage);
    }

    // Function to execute command
    function executeCommand(command) {
        const parts = command.trim().split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        if (commands[cmd]) {
            try {
                const result = commands[cmd].execute(args);
                addOutput(result);
            } catch (error) {
                addOutput(`Error executing command: ${error.message}`);
            }
        } else if (cmd) {
            addOutput(`Command not found: ${cmd}. Type 'help' for available commands.`);
        }
    }

    // Handle input submission
    function handleCommand() {
        const command = terminalInput.value.trim();
        if (command) {
            // Add command to history
            commandHistory.push(command);
            historyIndex = commandHistory.length;

            // Display command
            addOutput(`$ ${command}`);

            // Execute command
            executeCommand(command);

            // Clear input
            terminalInput.value = '';
        }
    }

    // Event listeners
    terminalInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCommand();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                terminalInput.value = commandHistory[historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                terminalInput.value = commandHistory[historyIndex];
            } else {
                historyIndex = commandHistory.length;
                terminalInput.value = '';
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            // Tab completion
            const currentValue = terminalInput.value.toLowerCase();
            const matchingCommands = Object.keys(commands).filter(cmd => cmd.startsWith(currentValue));
            if (matchingCommands.length === 1) {
                terminalInput.value = matchingCommands[0];
            }
        }
    });

    // Display welcome message
    displayWelcome();

    // Focus input when clicking on terminal
    document.querySelector('.terminal-body').addEventListener('click', function() {
        terminalInput.focus();
    });

    // Auto-focus input
    terminalInput.focus();
});
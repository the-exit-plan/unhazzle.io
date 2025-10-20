// Terminal functionality
document.addEventListener('DOMContentLoaded', function() {
    const terminalInput = document.getElementById('terminal-input');
    const terminalOutput = document.getElementById('terminal-output');
    const cursor = document.querySelector('.cursor');

    // Add null checks for critical elements
    if (!terminalInput || !terminalOutput) {
        console.error('Terminal elements not found. Terminal functionality disabled.');
        return;
    }

    let commandHistory = [];
    let historyIndex = -1;
    let currentCommand = '';
    let hasApplied = false; // Track if apply has been run

    // Predefined commands
    const commands = {
        help: {
            description: 'Show available commands',
            execute: function() {
                return `Available commands:
   unhazzle help          - Show this help message
   unhazzle login         - Sign in with Github
   unhazzle init          - Initialize unhazzle project
   unhazzle logs          - Fetch application logs
   unhazzle application   - Manage applications
   unhazzle database      - Manage databases
   unhazzle cache         - Manage cache services
   unhazzle apply         - Apply infrastructure changes
   unhazzle status        - Show deployment status
   clear                  - Clear the terminal screen
   history                - Show command history`;
            }
        },
        login: {
            description: 'Sign in with Github',
            execute: function() {
                return `🔐 Logged in with Github successfully!
Welcome back, Tavo! Your repositories are now accessible.`;
            }
        },
        init: {
            description: 'Initialize unhazzle project',
            execute: function() {
                return `🚀 Initialized unhazzle project 'tavo-portfolio'
Created default environment: dev
Generated unhazzle.yaml manifest
Ready to configure resources!`;
            }
        },
        application: {
            description: 'Manage applications',
            execute: function(args) {
                if (args[0] === 'create') {
                    const name = args[2] || 'my-app';
                    return `📦 Created application '${name}'
Public endpoint: https://${name}.unhazzle.dev
Environment variables injected automatically
Application is ready for deployment!`;
                } else if (args[0] === 'list') {
                    if (!hasApplied) {
                        return `No applications found. Run 'unhazzle apply' to deploy resources.`;
                    }
                    return `Applications:
  - my-app (Next.js, dev, https://my-app.unhazzle.dev)`;
                }
                return `Usage: unhazzle application create --name APP_NAME [--image IMAGE]
       unhazzle application list`;
            }
        },
        database: {
            description: 'Manage databases',
            execute: function(args) {
                if (args[0] === 'create') {
                    const name = args[2] || 'my-db';
                    const engine = args.includes('--engine') ? args[args.indexOf('--engine') + 1] : 'postgres';
                    return `🗄️ Created database '${name}' (${engine})
Connection string injected to application environment
Endpoint: ${name}.internal.unhazzle.dev (internal only)
Backups: Daily with 7-day retention`;
                } else if (args[0] === 'list') {
                    if (!hasApplied) {
                        return `No databases found. Run 'unhazzle apply' to deploy resources.`;
                    }
                    return `Databases:
  - my-db (PostgreSQL, small, dev)`;
                }
                return `Usage: unhazzle database create --name DB_NAME [--engine postgres|mysql|mongodb]
       unhazzle database list`;
            }
        },
        cache: {
            description: 'Manage cache services',
            execute: function(args) {
                if (args[0] === 'create') {
                    const name = args[2] || 'my-cache';
                    return `⚡ Created cache '${name}' (Redis)
Connection string injected to application environment
Endpoint: ${name}.internal.unhazzle.dev (internal only)`;
                } else if (args[0] === 'list') {
                    if (!hasApplied) {
                        return `No cache services found. Run 'unhazzle apply' to deploy resources.`;
                    }
                    return `Cache services:
  - my-cache (Redis, small, dev)`;
                }
                return `Usage: unhazzle cache create --name CACHE_NAME
        unhazzle cache list`;
            }
        },
        logs: {
            description: 'Fetch application logs',
            execute: function(args) {
                if (!hasApplied) {
                    return `No application deployed. Run 'unhazzle apply' to deploy your infrastructure.`;
                }
                return `📋 Application Logs (last 50 lines):

2024-10-20 14:32:15 INFO  Starting application on port 3000
2024-10-20 14:32:16 INFO  Connected to database successfully
2024-10-20 14:32:17 INFO  Cache connection established
2024-10-20 14:32:20 INFO  GET / 200 45ms
2024-10-20 14:32:22 INFO  GET /api/users 200 23ms
2024-10-20 14:32:25 INFO  POST /api/login 200 67ms
2024-10-20 14:32:28 INFO  GET /dashboard 200 34ms
2024-10-20 14:32:30 WARN  Rate limit exceeded for IP 192.168.1.100
2024-10-20 14:32:35 INFO  GET /api/data 200 45ms
2024-10-20 14:32:40 INFO  POST /api/submit 201 89ms
2024-10-20 14:32:45 INFO  GET /static/css/main.css 200 12ms
2024-10-20 14:32:50 INFO  GET /static/js/app.js 200 15ms
2024-10-20 14:32:55 INFO  Database query executed in 23ms
2024-10-20 14:33:00 INFO  Cache hit for user:123
2024-10-20 14:33:05 INFO  GET /health 200 5ms
2024-10-20 14:33:10 INFO  Memory usage: 45%
2024-10-20 14:33:15 INFO  CPU usage: 12%`;
            }
        },
        apply: {
            description: 'Apply infrastructure changes',
            execute: function() {
                hasApplied = true; // Mark as applied
                return `🔄 Applying infrastructure changes...
Estimated monthly cost: €12.50
Resources to provision:
  - 1 Application (0.5 CPU, 512Mi RAM)
  - 1 Database (PostgreSQL, small)
  - 1 Cache (Redis, small)

✅ Infrastructure deployed successfully!
Your application is live at: https://my-app.unhazzle.dev`;
            }
        },
        status: {
            description: 'Show deployment status',
            execute: function() {
                if (!hasApplied) {
                    return `No deployment found. Run 'unhazzle apply' to deploy your infrastructure.`;
                }
                return `📊 Deployment Status:
Environment: dev
Applications: 1 running
Databases: 1 running
Cache: 1 running
Last deployment: 2 minutes ago
Health: All systems operational`;
            }
        },
        cat: {
            description: 'Display deployment manifest',
            execute: function(args) {
                if (args[0] === 'unhazzle.yaml' || args.length === 0) {
                    return `project: tavo-portfolio
environment: dev

resources:
  applications:
    - name: my-app
      type: nextjs
      repo: github.com/tavo/portfolio
      cpu: 0.5
      memory: 512Mi
      public: true

  databases:
    - name: my-db
      engine: postgresql
      size: small

  cache:
    - name: my-cache
      engine: redis
      size: small`;
                }
                return `Usage: unhazzle cat [unhazzle.yaml]`;
            }
        },
        clear: {
            description: 'Clear the terminal screen',
            execute: function() {
                terminalOutput.innerHTML = '';
                return '';
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

Type 'unhazzle help' to see available commands.
Type 'unhazzle login' to get started with your Github account.
Type 'clear' to clear the screen.

`;
        addOutput(welcomeMessage);
    }

    // Function to execute command
    function executeCommand(command) {
        const parts = command.trim().split(/\s+/);
        let cmd = parts[0].toLowerCase();
        let args = parts.slice(1);

        if (cmd === 'unhazzle') {
            cmd = args[0].toLowerCase();
            args = args.slice(1);
        }

        if (commands[cmd]) {
            try {
                const result = commands[cmd].execute(args);
                addOutput(result);
            } catch (error) {
                addOutput(`Error executing command: ${error.message}`);
            }
        } else if (cmd) {
            addOutput(`Command not found: ${cmd}. Type 'unhazzle help' for available commands.`);
        }
    }

    // Handle input submission
    function handleCommand() {
        const command = terminalInput.value.trim();
        console.log('Handling command:', command); // Debug logging
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
    console.log('Setting up terminal event listeners'); // Debug logging
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
            const matchingCommands = Object.keys(commands).filter(cmd => cmd.startsWith(currentValue) || `unhazzle ${cmd}`.startsWith(currentValue));
            if (matchingCommands.length === 1) {
                terminalInput.value = `unhazzle ${matchingCommands[0]}`;
            }
        }
    });

    // Display welcome message
    displayWelcome();

    // Focus input when clicking on terminal
    document.querySelector('.terminal-body').addEventListener('click', function() {
        if (terminalInput) {
            terminalInput.focus();
        }
    });

    // Auto-focus input
    if (terminalInput) {
        terminalInput.focus();
    }
});

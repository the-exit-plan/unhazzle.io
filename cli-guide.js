// Terminal functionality for CLI Guide
document.addEventListener('DOMContentLoaded', function() {
    const terminalInput = document.getElementById('terminal-input');
    const terminalOutput = document.getElementById('terminal-output');
    const progressFill = document.getElementById('progress-fill');
    const currentStepEl = document.getElementById('current-step');
    const totalStepsEl = document.getElementById('total-steps');

    // Add null checks for critical elements
    if (!terminalInput || !terminalOutput) {
        console.error('Terminal elements not found. Terminal functionality disabled.');
        return;
    }

    let commandHistory = [];
    let historyIndex = -1;
    let currentCommand = '';
    let hasApplied = false; // Track if apply has been run
    let isDeploying = false; // Track if deployment is in progress
    let projectConfig = null; // Store generated project configuration
    let generatedYaml = null; // Store the actual generated YAML content
    let currentStep = 0;
    let interactiveMode = false;
    let interactiveCommand = '';
    let interactiveStep = 0;
    let loginData = {};
    let currentPrompt = '$';
    let isLoggedIn = false;
    let forcedLogin = false;
    let logStreamingMode = false;
    let logStreamInterval = null;

    const steps = [
        {
            title: "Welcome to Unhazzle CLI",
            description: "Type the command: <code>unhazzle help</code><br><small>This will show you all available commands to get started.</small>",
            command: "unhazzle help",
            completed: false
        },
        {
            title: "Step 1: Login with GitHub",
            description: "Authenticate with your GitHub account:<br><code>unhazzle login</code><br><small>This connects your GitHub repositories for deployment.</small>",
            command: "unhazzle login",
            completed: false
        },
        {
            title: "Step 2: Initialize Project",
            description: "Create a new Unhazzle project:<br><code>unhazzle init --name my-project --env dev --with-app --app-name my-app --app-image node:18</code><br><small>Available flags with defaults:<br>--name (my-project), --env (dev), --with-app (true), --app-name (my-app), --app-image (node:18), --app-cpu (0.5), --app-memory (512Mi), --public (true), --with-db (false), --db-engine (postgres), --db-size (small), --with-cache (false), --cache-engine (redis), --cache-size (small), --with-github-actions (false).</small>",
            command: "unhazzle init --name my-project --env dev --with-app --app-name my-app --app-image node:18",
            completed: false
        },
        {
            title: "Step 3: Deploy Infrastructure",
            description: "Apply all infrastructure changes:<br><code>unhazzle apply</code><br><small>This deploys everything to production with cost estimation.</small>",
            command: "unhazzle apply",
            completed: false
        },
        {
            title: "Step 4: Check Status",
            description: "Verify your deployment:<br><code>unhazzle status</code><br><small>This shows the health and status of all your services.</small>",
            command: "unhazzle status",
            completed: false
        },
        {
            title: "Step 5: Monitor Application Logs",
            description: "Start monitoring application logs:<br><code>unhazzle logs</code><br><small>This starts streaming application logs in real-time. Run the command again to stop log streaming.</small>",
            command: "unhazzle logs",
            completed: false
        },
         {
             title: "Step 6: Destroy Infrastructure",
             description: "Destroy all infrastructure resources:<br><code>unhazzle destroy</code><br><small>This will prompt for confirmation by requiring you to type the project name. Use with extreme caution!</small>",
             command: "unhazzle destroy",
             completed: false
         },
        {
            title: "Tutorial Complete!",
            description: "🎉 You've successfully completed the Unhazzle CLI journey!<br><br>You can now explore more commands like <code>unhazzle cat unhazzle.yaml</code> or <code>clear</code> to reset the terminal.",
            command: "",
            completed: true
        }
    ];

    const totalSteps = steps.length - 2; // Exclude welcome and completion steps
    totalStepsEl.textContent = totalSteps;

    // Predefined commands (same as main terminal)
    const commands = {
        help: {
            description: 'Show available commands',
            execute: function() {
                return `Available commands:
    unhazzle help          - Show this help message
    unhazzle login         - Sign in with Github
    unhazzle init [flags] - Initialize unhazzle project
      --name NAME              Project name (default: my-project)
      --env ENV                Environment: dev/staging/prod (default: dev)
      --with-app               Include application (default: true)
      --app-name NAME          Application name (default: my-app)
      --app-image IMAGE        Application Docker image (default: node:18)
      --app-cpu CPU            CPU cores: 0.25/0.5/1.0/2.0 (default: 0.5)
      --app-memory MEM         Memory: 256Mi/512Mi/1Gi/2Gi/4Gi (default: 512Mi)
      --public                 Make application publicly accessible (default: true)
      --with-db                Include database (default: false)
      --db-engine ENGINE       Database engine: postgres/mysql/mongodb (default: postgres)
      --db-size SIZE           Database size: small/medium/large (default: small)
      --with-cache             Include cache service (default: false)
      --cache-engine ENGINE    Cache engine: redis/memcached (default: redis)
      --cache-size SIZE        Cache size: small/medium/large (default: small)
      --with-github-actions    Generate GitHub Actions workflows (default: false)
    unhazzle logs          - Fetch application logs
    unhazzle application   - Manage applications
    unhazzle database      - Manage databases
    unhazzle cache         - Manage cache services
    unhazzle apply         - Apply infrastructure changes
    unhazzle status        - Show deployment status
    unhazzle destroy       - Destroy infrastructure resources
    curl                   - Make HTTP requests
    clear                  - Clear the terminal screen
    history                - Show command history`;
            }
        },
        login: {
            description: 'Sign in with Github',
            execute: function() {
                if (!forcedLogin) {
                    clearOutput();
                }
                interactiveMode = true;
                interactiveCommand = 'login';
                interactiveStep = 1;
                currentPrompt = 'choice> ';
                updatePrompt();
                const message = forcedLogin ?
                    `Authentication required. Please login to continue with project initialization.

GitHub Login
>> Allow Unhazzle to access your GitHub account? (y/n, default: y)` :
                    `GitHub Login
>> Allow Unhazzle to access your GitHub account? (y/n, default: y)`;
                forcedLogin = false; // reset
                return message;
            }
        },
        init: {
            description: 'Initialize unhazzle project with flags',
            execute: function(args) {
                // Reset previous configuration when starting new init
                projectConfig = null;
                generatedYaml = null;

                // Parse flags
                const flags = {};
                for (let i = 0; i < args.length; i++) {
                    const arg = args[i];
                    if (arg.startsWith('--')) {
                        const flagName = arg.substring(2);
                        const nextArg = args[i + 1];
                        if (nextArg && !nextArg.startsWith('--')) {
                            flags[flagName] = nextArg;
                            i++; // Skip the next arg as it's the value
                        } else {
                            flags[flagName] = true; // Boolean flag
                        }
                    }
                }

                // Set defaults and validate
                const projectName = flags.name || 'my-project';
                const environment = flags.env || 'dev';
                if (!['dev', 'staging', 'prod'].includes(environment)) {
                    return `Error: Invalid environment '${environment}'. Must be dev, staging, or prod.`;
                }

                const addApp = flags['with-app'] !== false && flags['with-app'] !== 'false';
                const appName = flags['app-name'] || 'my-app';
                const appCpu = flags['app-cpu'] || '0.5';
                const validCpus = ['0.25', '0.5', '1.0', '2.0'];
                if (!validCpus.includes(appCpu)) {
                    return `Error: Invalid CPU '${appCpu}'. Must be 0.25, 0.5, 1.0, or 2.0.`;
                }

                const appMemory = flags['app-memory'] || '512Mi';
                const validMemory = ['256Mi', '512Mi', '1Gi', '2Gi', '4Gi'];
                if (!validMemory.includes(appMemory)) {
                    return `Error: Invalid memory '${appMemory}'. Must be 256Mi, 512Mi, 1Gi, 2Gi, or 4Gi.`;
                }

                const appImage = flags['app-image'] || 'node:18';

                const addDb = flags['with-db'] === true || flags['with-db'] === 'true';
                const dbEngine = flags['db-engine'] || 'postgres';
                if (!['postgres', 'mysql', 'mongodb'].includes(dbEngine)) {
                    return `Error: Invalid database engine '${dbEngine}'. Must be postgres, mysql, or mongodb.`;
                }

                const dbSize = flags['db-size'] || 'small';
                if (!['small', 'medium', 'large'].includes(dbSize)) {
                    return `Error: Invalid database size '${dbSize}'. Must be small, medium, or large.`;
                }

                const addCache = flags['with-cache'] === true || flags['with-cache'] === 'true';
                const cacheEngine = flags['cache-engine'] || 'redis';
                if (!['redis', 'memcached'].includes(cacheEngine)) {
                    return `Error: Invalid cache engine '${cacheEngine}'. Must be redis or memcached.`;
                }

                const cacheSize = flags['cache-size'] || 'small';
                if (!['small', 'medium', 'large'].includes(cacheSize)) {
                    return `Error: Invalid cache size '${cacheSize}'. Must be small, medium, or large.`;
                }

                const addGitHubActions = flags['with-github-actions'] === true || flags['with-github-actions'] === 'true';
                const isPublic = flags['public'] !== false && flags['public'] !== 'false';

                // Store configuration
                loginData = {
                    projectName,
                    environment,
                    addApp,
                    appName,
                    appCpu,
                    appMemory,
                    appImage,
                    isPublic,
                    addDb,
                    dbEngine,
                    dbSize,
                    addCache,
                    cacheEngine,
                    cacheSize,
                    addGitHubActions
                };

                // Generate YAML
                let yaml = `project: ${projectName.replace(/'/g, "\\'")}
environment: ${environment}

resources:`;

                if (addApp) {
                    yaml += `
  applications:
    - name: ${appName}
      type: application
      image: ${appImage}
      cpu: ${appCpu}
      memory: ${appMemory}
      public: ${isPublic}`;
                }

                if (addDb) {
                    yaml += `

  databases:
    - name: ${projectName.replace(/'/g, "\\'")}-db
      engine: ${dbEngine}
      size: ${dbSize}`;
                }

                if (addCache) {
                    yaml += `

  caches:
    - name: ${projectName.replace(/'/g, "\\'")}-cache
      engine: ${cacheEngine}
      size: ${cacheSize}`;
                }

                if (addGitHubActions) {
                    yaml += `

github_actions:
  enabled: true
  workflows:
    - deploy`;
                }

                projectConfig = {
                    projectName,
                    environment,
                    hasApp: addApp,
                    appName,
                    appCpu,
                    appMemory,
                    appImage,
                    isPublic,
                    hasDb: addDb,
                    dbEngine,
                    dbSize,
                    hasCache: addCache,
                    cacheEngine,
                    cacheSize,
                    hasGitHubActions: addGitHubActions
                };
                generatedYaml = yaml;

                return `🚀 Initialized unhazzle project '${projectName.replace(/'/g, "\\'")}'
Created environment: ${environment}
Generated unhazzle.yaml manifest:

${yaml}

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
  - ${projectConfig.appName} (${projectConfig.appCpu} CPU, ${projectConfig.appMemory}, ${projectConfig.environment}, https://${projectConfig.appName}.unhazzle.dev)`;
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
  - ${projectConfig.projectName}-database (${projectConfig.dbEngine}, ${projectConfig.dbSize}, ${projectConfig.environment})`;
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
                    const engine = args.includes('--engine') ? args[args.indexOf('--engine') + 1] : 'redis';
                    return `⚡ Created cache '${name}' (${engine})
Connection string injected to application environment
Endpoint: ${name}.internal.unhazzle.dev (internal only)`;
                } else if (args[0] === 'list') {
                    if (!hasApplied) {
                        return `No cache services found. Run 'unhazzle apply' to deploy resources.`;
                    }
                    return `Cache services:
  - ${projectConfig.projectName}-cache (${projectConfig.cacheEngine}, ${projectConfig.cacheSize}, ${projectConfig.environment})`;
                }
                return `Usage: unhazzle cache create --name CACHE_NAME
        unhazzle cache list`;
            }
        },
        logs: {
            description: 'Fetch application logs',
            execute: function(args) {
                if (!projectConfig || !projectConfig.hasApp) {
                    return `No application deployed. Run 'unhazzle apply' to deploy your infrastructure.`;
                }
                if (!hasApplied) {
                    return `Application not yet deployed. Run 'unhazzle apply' to deploy your infrastructure.`;
                }

                if (logStreamingMode) {
                    clearInterval(logStreamInterval);
                    logStreamingMode = false;
                    return `📋 Stopped log streaming.`;
                }

                logStreamingMode = true;
                let logCount = 0;

                // Start streaming logs
                addOutput(`📋 Starting application log streaming... (Press Ctrl+C or run 'unhazzle logs' again to stop)`);

                const initialLogs = [
                    `2024-10-20 14:32:15 INFO  Starting application on port 3000`,
                    `2024-10-20 14:32:16 INFO  Connected to database successfully`,
                    `2024-10-20 14:32:17 INFO  Cache connection established`,
                    `2024-10-20 14:32:18 INFO  Application health check passed`,
                    `2024-10-20 14:32:20 INFO  GET / 200 45ms`,
                    `2024-10-20 14:32:22 INFO  GET /api/users 200 23ms`,
                    `2024-10-20 14:32:25 INFO  POST /api/login 200 67ms`,
                    `2024-10-20 14:32:28 INFO  GET /dashboard 200 34ms`,
                    `2024-10-20 14:32:30 WARN  Rate limit exceeded for IP 192.168.1.100`,
                    `2024-10-20 14:32:32 INFO  GET /api/profile 200 28ms`,
                    `2024-10-20 14:32:35 INFO  GET /api/data 200 45ms`,
                    `2024-10-20 14:32:38 INFO  PUT /api/settings 200 52ms`,
                    `2024-10-20 14:32:40 INFO  POST /api/submit 201 89ms`,
                    `2024-10-20 14:32:42 INFO  DELETE /api/session 204 15ms`,
                    `2024-10-20 14:32:45 INFO  GET /health 200 12ms`,
                    `2024-10-20 14:32:48 INFO  Database connection pool healthy`,
                    `2024-10-20 14:32:50 INFO  Cache hit ratio: 94.2%`
                ];

                // Show initial logs
                initialLogs.forEach(log => addOutput(log));

                // Start periodic log streaming - only health checks by default
                logStreamInterval = setInterval(() => {
                    const now = new Date();
                    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
                    addOutput(`${timestamp} INFO  GET /health 200 ${Math.floor(Math.random() * 10 + 1)}ms`);
                    logCount++;
                    if (logCount > 50) {
                        clearInterval(logStreamInterval);
                        logStreamingMode = false;
                        addOutput(`📋 Log streaming stopped after 50 entries. Run 'unhazzle logs' to start again.`);
                    }
                }, 3000);

                return '';
            }
        },
        apply: {
            description: 'Apply infrastructure changes',
            execute: function() {
                if (!projectConfig) {
                    return `No project initialized. Run 'unhazzle init --interactive' to create a project.`;
                }

                // Build resources list based on actual configuration
                let resourcesList = [];
                let totalCost = 0;

                if (projectConfig.hasApp) {
                    // Calculate cost based on CPU and memory
                    const cpuCost = parseFloat(projectConfig.appCpu) * 10; // €10 per CPU core
                    const memoryGb = projectConfig.appMemory.endsWith('Gi') ?
                        parseFloat(projectConfig.appMemory.replace('Gi', '')) :
                        parseFloat(projectConfig.appMemory.replace('Mi', '')) / 1024;
                    const memoryCost = memoryGb * 5; // €5 per GB
                    const appCost = Math.max(cpuCost + memoryCost, 5.00); // Minimum €5
                    resourcesList.push(`  - 1 Application (${projectConfig.appCpu} CPU, ${projectConfig.appMemory})`);
                    totalCost += appCost;
                }
                if (projectConfig.hasDb) {
                    const dbCost = projectConfig.dbSize === 'medium' ? 5.00 : projectConfig.dbSize === 'large' ? 10.00 : 2.50;
                    resourcesList.push(`  - 1 Database (${projectConfig.dbEngine}, ${projectConfig.dbSize})`);
                    totalCost += dbCost;
                }
                if (projectConfig.hasCache) {
                    const cacheCost = projectConfig.cacheSize === 'medium' ? 3.00 : projectConfig.cacheSize === 'large' ? 6.00 : 1.50;
                    resourcesList.push(`  - 1 Cache (${projectConfig.cacheEngine}, ${projectConfig.cacheSize})`);
                    totalCost += cacheCost;
                }

                const resourcesText = resourcesList.length > 0 ? resourcesList.join('\n') : '  - No resources selected';

                isDeploying = true; // Mark deployment as in progress

                // Simulate deployment time
                setTimeout(() => {
                    hasApplied = true; // Mark as applied after deployment
                    isDeploying = false; // Mark deployment as complete

                    const appUrl = projectConfig.hasApp ? `https://${projectConfig.projectName.replace(/'/g, '')}.unhazzle.dev` : '';

                    let successMessage = '✅ Infrastructure deployed successfully!';
                    if (projectConfig.hasApp) {
                        successMessage += `\nYour application is live at: ${appUrl}`;
                    }
                    if (projectConfig.hasGitHubActions) {
                        successMessage += '\nGitHub Actions workflow generated for automatic deployments. Commit this file.';
                    }

                    addOutput(successMessage);
                }, 5000); // 5 second deployment simulation

                return `🔄 Applying infrastructure changes...
Estimated monthly cost: €${totalCost.toFixed(2)}
Resources to provision:
${resourcesText}

⏳ Deploying infrastructure...`;
            }
        },
        status: {
            description: 'Show deployment status',
            execute: function() {
                if (!projectConfig) {
                    return `No project initialized. Run 'unhazzle init --interactive' to create a project.`;
                }
                if (isDeploying) {
                    return `🚀 Deployment in progress... Please wait for infrastructure provisioning to complete.`;
                }
                if (!hasApplied) {
                    return `Project initialized but not deployed. Run 'unhazzle apply' to deploy your infrastructure.`;
                }

                // Simulate status fetching delay
                setTimeout(() => {
                    // Build status lines for resources that exist
                    let statusLines = [`Environment: ${projectConfig.environment}`];

                    if (projectConfig.hasApp) {
                        statusLines.push(`Applications: 1 running (${projectConfig.appCpu} CPU, ${projectConfig.appMemory})`);
                    }
                    if (projectConfig.hasDb) {
                        statusLines.push(`Databases: 1 running (${projectConfig.dbEngine}, ${projectConfig.dbSize})`);
                    }
                    if (projectConfig.hasCache) {
                        statusLines.push(`Cache: 1 running (${projectConfig.cacheEngine}, ${projectConfig.cacheSize})`);
                    }
                    if (projectConfig.hasGitHubActions) {
                        statusLines.push('GitHub Actions: Enabled');
                    }

                    // Calculate total estimated cost
                    let totalCost = 0;
                    if (projectConfig.hasApp) {
                        const cpuCost = parseFloat(projectConfig.appCpu) * 10;
                        const memoryGb = projectConfig.appMemory.endsWith('Gi') ?
                            parseFloat(projectConfig.appMemory.replace('Gi', '')) :
                            parseFloat(projectConfig.appMemory.replace('Mi', '')) / 1024;
                        const memoryCost = memoryGb * 5;
                        totalCost += Math.max(cpuCost + memoryCost, 5.00);
                    }
                    if (projectConfig.hasDb) {
                        totalCost += projectConfig.dbSize === 'medium' ? 5.00 : projectConfig.dbSize === 'large' ? 10.00 : 2.50;
                    }
                    if (projectConfig.hasCache) {
                        totalCost += projectConfig.cacheSize === 'medium' ? 3.00 : projectConfig.cacheSize === 'large' ? 6.00 : 1.50;
                    }

                    addOutput(`📊 Deployment Status:
${statusLines.join('\n')}
Last deployment: 2 minutes ago
Health: All systems operational
Estimated monthly cost: €${totalCost.toFixed(2)}`);
                }, 1000); // 1 second delay

                return `🔍 Fetching deployment status...`;
            }
        },
        cat: {
            description: 'Display deployment manifest',
            execute: function(args) {
                if (args[0] === 'unhazzle.yaml' || args.length === 0) {
                    if (!generatedYaml) {
                        return `No unhazzle.yaml found. Run 'unhazzle init --interactive' to create a project.`;
                    }
                    // Return only the infrastructure YAML, exclude workflows section
                    const workflowsIndex = generatedYaml.indexOf('\nworkflows:');
                    if (workflowsIndex !== -1) {
                        return generatedYaml.substring(0, workflowsIndex);
                    }
                    return generatedYaml;
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
        },
        curl: {
            description: 'Make HTTP requests',
            execute: function(args) {
                if (!projectConfig || !projectConfig.hasApp || !hasApplied) {
                    return `No application deployed. Run 'unhazzle apply' to deploy your infrastructure first.`;
                }

                // Parse curl arguments
                let method = 'GET';
                let url = '';
                let data = '';
                let headers = {};

                for (let i = 0; i < args.length; i++) {
                    const arg = args[i];
                    if (arg === '-X' || arg === '--request') {
                        method = args[++i];
                    } else if (arg === '-d' || arg === '--data' || arg === '--data-raw') {
                        data = args[++i];
                    } else if (arg === '-H' || arg === '--header') {
                        const header = args[++i];
                        const [key, value] = header.split(': ');
                        headers[key] = value;
                    } else if (!arg.startsWith('-') && !url) {
                        url = arg;
                    }
                }

                if (!url) {
                    return `Usage: curl [options] <url>
Options:
  -X, --request METHOD    Specify request method
  -d, --data DATA         HTTP POST data
  -H, --header HEADER     Pass custom header(s)`;
                }

                // Simulate HTTP request
                const now = new Date();
                const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
                const statusCode = method === 'POST' ? 201 : 200;
                const responseTime = Math.floor(Math.random() * 100 + 20);

                // Generate logs for this request
                if (logStreamingMode) {
                    setTimeout(() => {
                        addOutput(`${timestamp} INFO  ${method} ${url.replace('https://' + projectConfig.appName + '.unhazzle.dev', '')} ${statusCode} ${responseTime}ms`);

                        if (data) {
                            // Parse and log request body
                            try {
                                const parsedData = JSON.parse(data);
                                addOutput(`${timestamp} INFO  Processing request body: ${JSON.stringify(parsedData)}`);
                                if (parsedData.name && parsedData.email) {
                                    addOutput(`${timestamp} INFO  Creating user: ${parsedData.name} (${parsedData.email})`);
                                    addOutput(`${timestamp} INFO  User validation successful`);
                                    // Add database write logs if database was deployed
                                    if (projectConfig.hasDb) {
                                        setTimeout(() => {
                                            const dbTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
                                            addOutput(`${dbTimestamp} INFO  INSERT INTO users (name, email, created_at) VALUES ('${parsedData.name}', '${parsedData.email}', '${new Date().toISOString()}')`);
                                            addOutput(`${dbTimestamp} INFO  Database write completed successfully`);
                                        }, 200);
                                    }
                                } else if (parsedData.message) {
                                    addOutput(`${timestamp} INFO  Received message: "${parsedData.message}"`);
                                }
                            } catch (e) {
                                addOutput(`${timestamp} INFO  Processing request body: ${data}`);
                            }
                        }

                        addOutput(`${timestamp} INFO  Request completed successfully`);
                    }, 1000);
                }

                // Return curl response
                let response = '';
                if (method === 'POST' && data) {
                    try {
                        const parsedData = JSON.parse(data);
                        if (parsedData.name && parsedData.email) {
                            // Simulate user creation
                            const userId = Math.floor(Math.random() * 10000);
                            response = `{"status":"success","user":{"id":${userId},"name":"${parsedData.name}","email":"${parsedData.email}","createdAt":"${now.toISOString()}"},"message":"User created successfully"}`;
                        } else {
                            response = `{"status":"success","received":${JSON.stringify(parsedData)},"timestamp":"${now.toISOString()}"}`;
                        }
                    } catch (e) {
                        response = `{"status":"success","received":"${data}","timestamp":"${now.toISOString()}"}`;
                    }
                } else {
                    response = `{"status":"success","message":"Hello from ${projectConfig.appName}!","timestamp":"${now.toISOString()}"}`;
                }

                return response;
            }
        },
        destroy: {
            description: 'Destroy infrastructure resources',
            execute: function() {
                if (!projectConfig) {
                    return `No project initialized. Run 'unhazzle init --interactive' to create a project.`;
                }
                if (!hasApplied) {
                    return `No infrastructure deployed. Run 'unhazzle apply' to deploy resources first.`;
                }

                interactiveMode = true;
                interactiveCommand = 'destroy';
                interactiveStep = 1;
                currentPrompt = 'confirm> ';
                updatePrompt();

                return `⚠️  WARNING: This will permanently destroy all infrastructure resources for project '${projectConfig.projectName}'!

This action cannot be undone. All data, applications, databases, and cache services will be permanently lost.

Type '${projectConfig.projectName}' to confirm destruction, or 'cancel' to abort:`;
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

    // Function to clear terminal output
    function clearOutput() {
        terminalOutput.innerHTML = '';
    }

    // Function to display welcome message
    function displayWelcome() {
        const welcomeMessage = `
Welcome to Unhazzle CLI Guide v1.0.0
Interactive terminal experience.
`;
        addOutput(welcomeMessage);
    }

    // Function to update prompt display
    function updatePrompt() {
        document.querySelector('.prompt').textContent = currentPrompt;
    }

    // Function to handle interactive input
    function handleInteractiveInput(input) {
        if (interactiveCommand === 'login') {
            if (interactiveStep === 1) {
                // Permission input
                const choice = input.trim().toLowerCase();
                if (choice === '' || choice === 'y' || choice === 'yes') {
                    clearOutput();
                    addOutput(`Permission granted!

GitHub Login
>> Authenticating with GitHub...`);

                    // Simulate authentication delay
                    setTimeout(() => {
                        addOutput(`🔐 Logged in with Github successfully!
Welcome back! Your repositories are now accessible for deployment.`);
                        isLoggedIn = true;
                        exitInteractiveMode();
                        checkTutorialProgress('unhazzle login');
                     }, 2000);
                } else if (choice === 'n' || choice === 'no') {
                    addOutput("Login cancelled.");
                    exitInteractiveMode();
                } else {
                    addOutput("Please enter 'y' for yes or 'n' for no:");
                }
            }
        } else if (interactiveCommand === 'destroy') {
            if (interactiveStep === 1) {
                // Destruction confirmation
                const confirmation = input.trim();
                if (confirmation === projectConfig.projectName) {
                    addOutput(`Project name confirmed. Proceeding with destruction...

🔄 Destroying infrastructure resources for '${projectConfig.projectName}'...
This will remove all deployed resources and stop billing.

⏳ Destroying infrastructure...`);

                    // Stop any ongoing log streaming
                    if (logStreamingMode) {
                        clearInterval(logStreamInterval);
                        logStreamingMode = false;
                        addOutput(`📋 Log streaming stopped due to infrastructure destruction.`);
                    }

                    // Simulate destruction time
                    setTimeout(() => {
                        hasApplied = false; // Mark as not applied
                        projectConfig = null; // Clear project config
                        generatedYaml = null; // Clear generated YAML

                        addOutput(`🗑️ Infrastructure destroyed successfully!
All resources for project '${confirmation}' have been removed and billing has stopped.
Your application, databases, and cache services are no longer available.`);
                        exitInteractiveMode();
                        checkTutorialProgress('unhazzle destroy');
                    }, 3000); // 3 second destruction simulation
                } else if (confirmation === 'cancel') {
                    addOutput("Destruction cancelled. Infrastructure remains intact.");
                    exitInteractiveMode();
                } else {
                    addOutput(`Invalid confirmation. Type '${projectConfig.projectName}' to confirm destruction, or 'cancel' to abort:`);
                }
            }
        }

    }

    // Function to exit interactive mode
    function exitInteractiveMode() {
        interactiveMode = false;
        interactiveCommand = '';
        interactiveStep = 0;
        loginData = {};
        currentPrompt = '$';
        updatePrompt();
    }

    // Function to execute command
    function executeCommand(command) {
        const parts = command.trim().split(/\s+/);
        let cmd = parts[0].toLowerCase();
        let args = parts.slice(1);

        if (cmd === 'unhazzle') {
            if (!args[0]) {
                addOutput('Usage: unhazzle <command> [options]');
                return;
            }
            cmd = args[0].toLowerCase();
            args = args.slice(1);
        }

        // Force login if trying to init without authentication
        if (cmd === 'init' && !isLoggedIn) {
            forcedLogin = true;
            cmd = 'login';
            args = [];
        }

        if (commands[cmd]) {
            try {
                const result = commands[cmd].execute(args);

                // Add delay for init command
                if (cmd === 'init') {
                    setTimeout(() => {
                        addOutput(result);
                        // Check if this command advances the tutorial (only for non-interactive commands)
                        if (!interactiveMode && cmd !== 'curl') {
                            checkTutorialProgress(command.trim());
                        }
                    }, 1000);
                } else {
                    addOutput(result);
                    // Check if this command advances the tutorial (only for non-interactive commands)
                    if (!interactiveMode && cmd !== 'curl') {
                        checkTutorialProgress(command.trim());
                    }
                }
            } catch (error) {
                addOutput(`Error executing command: ${error.message}`);
            }
        } else if (cmd) {
            addOutput(`Command not found: ${cmd}. Type 'unhazzle help' for available commands.`);
        }
    }

    // Function to check tutorial progress
    function checkTutorialProgress(executedCommand) {
        if (currentStep < steps.length - 1) {
            // For init command, check if it's any valid init command, not just the exact example
            if (currentStep === 2 && executedCommand.startsWith('unhazzle init')) {
                steps[currentStep].completed = true;
                currentStep++;
                updateStepUI();
            }
            // For other commands, do exact match
            else if (executedCommand === steps[currentStep].command) {
                steps[currentStep].completed = true;
                currentStep++;
                updateStepUI();
            }
        }
    }

    // Function to update step UI
    function updateStepUI() {
        currentStepEl.textContent = Math.min(currentStep + 1, totalSteps);
        progressFill.style.width = `${Math.min((currentStep + 1) / totalSteps * 100, 100)}%`;

        // Update step list highlighting and visibility
        document.querySelectorAll('.step-item').forEach((item, index) => {
            item.classList.toggle('active', index === currentStep);
            item.classList.toggle('completed', index < currentStep);
            const details = item.querySelector('.step-details');
            if (index === currentStep) {
                details.style.display = 'block';
            } else {
                details.style.display = 'none';
            }
        });


    }

    // Add click handlers for step headers
    document.querySelectorAll('.step-header').forEach((header, index) => {
        header.addEventListener('click', () => {
            // Allow toggling any step's details
            const details = header.parentElement.querySelector('.step-details');
            details.style.display = details.style.display === 'block' ? 'none' : 'block';
            // Ensure current step is always visible
            const currentDetails = document.querySelectorAll('.step-item')[currentStep].querySelector('.step-details');
            currentDetails.style.display = 'block';
        });
    });

    // Add click handlers for code elements
    document.addEventListener('click', (e) => {
        if (e.target.tagName === 'CODE') {
            const command = e.target.textContent;
            if (terminalInput) {
                terminalInput.value = command;
                terminalInput.focus();
            }
        }
    });

    // Handle input submission
    function handleCommand() {
        const input = terminalInput.value.trim();
        console.log('Handling command:', input); // Debug logging
        if (input || interactiveMode) {
            if (interactiveMode) {
                // Handle interactive input (allow empty input for defaults)
                addOutput(`${currentPrompt}${input || ''}`);
                handleInteractiveInput(input);
            } else {
                // Add command to history
                commandHistory.push(input);
                historyIndex = commandHistory.length;

                // Display command
                addOutput(`$ ${input}`);

                // Execute command
                executeCommand(input);
            }

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
        } else if (e.ctrlKey && e.key === 'c') {
            e.preventDefault();
            if (logStreamingMode) {
                clearInterval(logStreamInterval);
                logStreamingMode = false;
                addOutput(`^C`);
                addOutput(`📋 Log streaming stopped.`);
            }
        }
    });

    // Display welcome message
    displayWelcome();

    // Initialize prompt
    updatePrompt();

    // Initialize step UI
    updateStepUI();

    // Ensure terminal input is focusable
    setTimeout(() => {
        if (terminalInput) {
            terminalInput.focus();
        }
    }, 100);
});

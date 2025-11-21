import { DeploymentState } from '../context/DeploymentContext';

export function generateYAML(state: DeploymentState): string {
  if (!state.project) return '# No project configuration found';

  const env = state.project.environments[0]; // Default to first env
  if (!env) return '# No environment found';

  let yaml = `version: 1
project: ${state.project.slug}

environments:
  ${env.name}:
    region: ${state.region?.code || 'eu-central'}
    
    applications:`;

  env.applications.forEach(app => {
    yaml += `
      - name: ${app.name}
        image: ${app.imageUrl}
        replicas: ${app.resources.replicas.min}-${app.resources.replicas.max}
        resources:
          cpu: ${app.resources.cpu}
          memory: ${app.resources.memory}
        exposure: ${app.exposure}
        port: ${app.port}`;
        
    if (app.environmentVariables.length > 0) {
      yaml += `
        env:`;
      app.environmentVariables.forEach(v => {
        yaml += `
          - ${v.key}: ${v.masked ? '***' : v.value}`;
      });
    }
  });

  if (env.database) {
    yaml += `

    database:
      engine: ${env.database.engine}
      version: ${env.database.version}
      size: ${env.database.storage}`;
  }

  if (env.cache) {
    yaml += `

    cache:
      engine: ${env.cache.engine}
      version: ${env.cache.version}
      memory: ${env.cache.memory}`;
  }

  return yaml;
}

export function generateGitHubActions(): string {
  return `name: Deploy to Unhazzle

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Unhazzle
        uses: unhazzle/deploy-action@v1
        with:
          token: \${{ secrets.UNHAZZLE_TOKEN }}
          project: my-awesome-project
          environment: \${{ github.event_name == 'pull_request' && 'pr-' + github.event.number || 'production' }}`;
}

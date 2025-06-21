import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import { DockerContainer } from './dockerService';

const execAsync = promisify(exec);

export interface ContainerHealth {
  status: 'healthy' | 'unhealthy' | 'starting' | 'unknown';
  cpuUsage: string;
  memoryUsage: string;
  memoryLimit: string;
  networkRx: string;
  networkTx: string;
  uptime: string;
}

export class DockerHealthMonitor {
  /**
   * Get health status of a container
   */
  async getContainerHealth(container: DockerContainer): Promise<ContainerHealth> {
    try {
      // Get container stats in JSON format
      const { stdout } = await execAsync(
        `docker stats ${container.id} --no-stream --format "{{json .}}"`
      );

      const stats = JSON.parse(stdout);
      
      // Extract health status from container inspection
      const { stdout: inspectOut } = await execAsync(
        `docker inspect --format "{{.State.Health.Status}}" ${container.id}`
      );
      
      // Parse the results
      const status = inspectOut.trim() || 'unknown';
      const cpuUsage = stats.CPUPerc || '0%';
      const memoryUsage = stats.MemUsage ? stats.MemUsage.split(' / ')[0] : '0B';
      const memoryLimit = stats.MemUsage ? stats.MemUsage.split(' / ')[1] : '0B';
      const networkRx = stats.NetIO ? stats.NetIO.split(' / ')[0] : '0B';
      const networkTx = stats.NetIO ? stats.NetIO.split(' / ')[1] : '0B';
      
      // Get uptime
      const { stdout: uptimeOut } = await execAsync(
        `docker inspect --format "{{.State.StartedAt}}" ${container.id}`
      );
      
      const startTime = new Date(uptimeOut.trim());
      const uptime = this.formatUptime(Date.now() - startTime.getTime());

      return {
        status: status as ContainerHealth['status'],
        cpuUsage,
        memoryUsage,
        memoryLimit,
        networkRx,
        networkTx,
        uptime
      };
    } catch (error) {
      console.error(chalk.red(`Error getting container health: ${(error as Error).message}`));
      return {
        status: 'unknown',
        cpuUsage: 'N/A',
        memoryUsage: 'N/A',
        memoryLimit: 'N/A',
        networkRx: 'N/A',
        networkTx: 'N/A',
        uptime: 'N/A'
      };
    }
  }

  /**
   * Format milliseconds as human-readable uptime
   */
  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}
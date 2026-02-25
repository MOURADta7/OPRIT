/**
 * Logger Utility
 * Debug logging with environment-based levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private level: LogLevel;
  private prefix: string;
  
  constructor() {
    this.level = 'debug';
    this.prefix = '[ORBIT]';
  }
  
  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    return levels[level] >= levels[this.level];
  }
  
  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (!this.shouldLog(level)) return;
    
    const timestamp = new Date().toISOString();
    const fullMessage = `${this.prefix} [${level.toUpperCase()}] ${timestamp} - ${message}`;
    
    switch (level) {
      case 'debug':
        console.debug(fullMessage, ...args);
        break;
      case 'info':
        console.info(fullMessage, ...args);
        break;
      case 'warn':
        console.warn(fullMessage, ...args);
        break;
      case 'error':
        console.error(fullMessage, ...args);
        break;
    }
  }
  
  debug(message: string, ...args: any[]): void {
    this.log('debug', message, ...args);
  }
  
  info(message: string, ...args: any[]): void {
    this.log('info', message, ...args);
  }
  
  warn(message: string, ...args: any[]): void {
    this.log('warn', message, ...args);
  }
  
  error(message: string, ...args: any[]): void {
    this.log('error', message, ...args);
  }
  
  setLevel(level: LogLevel): void {
    this.level = level;
  }
}

export const logger = new Logger();
/**
 * Centralized Logger Utility for OfficeLLM
 * 
 * Provides consistent logging across the framework with timestamps and log levels
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export interface LoggerConfig {
  level: LogLevel;
  prefix?: string;
  timestamps?: boolean;
}

export class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: config.level ?? LogLevel.INFO,
      prefix: config.prefix ?? '',
      timestamps: config.timestamps ?? true,
    };
  }

  /**
   * Set the global log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Format the log message with timestamp and prefix
   */
  private format(level: string, component: string, message: string): string {
    const timestamp = this.config.timestamps ? new Date().toISOString() : '';
    const prefix = this.config.prefix ? `${this.config.prefix}:` : '';
    
    if (this.config.timestamps) {
      return `[${timestamp}] [${prefix}${level}${component ? `:${component}` : ''}] ${message}`;
    }
    return `[${prefix}${level}${component ? `:${component}` : ''}] ${message}`;
  }

  /**
   * Debug level logging
   */
  debug(component: string, message: string, data?: any): void {
    if (this.config.level <= LogLevel.DEBUG) {
      console.debug(this.format('DEBUG', component, message), data ?? '');
    }
  }

  /**
   * Info level logging
   */
  info(component: string, message: string, data?: any): void {
    if (this.config.level <= LogLevel.INFO) {
      console.log(this.format('INFO', component, message), data ?? '');
    }
  }

  /**
   * Warning level logging
   */
  warn(component: string, message: string, data?: any): void {
    if (this.config.level <= LogLevel.WARN) {
      console.warn(this.format('WARN', component, message), data ?? '');
    }
  }

  /**
   * Error level logging
   */
  error(component: string, message: string, error?: any): void {
    if (this.config.level <= LogLevel.ERROR) {
      console.error(this.format('ERROR', component, message), error ?? '');
    }
  }

  /**
   * Create a child logger with a specific prefix
   */
  child(prefix: string): Logger {
    return new Logger({
      ...this.config,
      prefix: this.config.prefix ? `${this.config.prefix}:${prefix}` : prefix,
    });
  }
}

// Default global logger instance
export const defaultLogger = new Logger({
  level: LogLevel.DEBUG,
  timestamps: true,
});

// Export convenience functions
export const logger = {
  debug: (component: string, message: string, data?: any) => defaultLogger.debug(component, message, data),
  info: (component: string, message: string, data?: any) => defaultLogger.info(component, message, data),
  warn: (component: string, message: string, data?: any) => defaultLogger.warn(component, message, data),
  error: (component: string, message: string, error?: any) => defaultLogger.error(component, message, error),
  setLevel: (level: LogLevel) => defaultLogger.setLevel(level),
  child: (prefix: string) => defaultLogger.child(prefix),
};


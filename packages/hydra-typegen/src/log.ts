import chalk from 'chalk'

export function warn(message: string) {
  // TODO: use a proper logger?
  console.warn(chalk.yellow(`WARNING: ${message}`))
}

export function error(message: string) {
  // TODO: use a proper logger?
  console.error(chalk.red(`ERROR: ${message}`))
}

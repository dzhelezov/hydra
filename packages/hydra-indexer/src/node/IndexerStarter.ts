import { configure, getConfig } from '.'
import { createDBConnection } from '../db/dal'
import { Connection, getConnection } from 'typeorm'
import Debug from 'debug'
import Container from 'typedi'
import { logError } from '@dzlzv/hydra-common'
import { RedisClientFactory } from '@dzlzv/hydra-db-utils'
import { eventEmitter, IndexerEvents } from './event-emitter'
import { RedisRelayer } from '../redis/RedisRelayer'
import { IndexBuilder } from '../indexer'

const debug = Debug('hydra-indexer:manager')

/**
 * A wrapper class for running the indexer and migrations
 */
export class IndexerStarter {
  /**
   * Starts the indexer
   *
   * @param options options passed to create the indexer service
   */
  static async index(): Promise<void> {
    debug(`Hydra Indexer version: ${getHydraVersion()}`)

    configure()
    await createDBConnection()

    Container.set(
      'RedisClientFactory',
      new RedisClientFactory(getConfig().REDIS_URI)
    )
    Container.set('RedisRelayer', new RedisRelayer())
    // Start only the indexer
    const indexBuilder = new IndexBuilder()
    try {
      await indexBuilder.start()
    } catch (e) {
      debug(`Stopping the indexer due to errors: ${JSON.stringify(e, null, 2)}`)
      process.exitCode = -1
    } finally {
      await cleanUp()
    }
  }

  /**
   * Run migrations in the "migrations" folder;
   */
  static async migrate(): Promise<void> {
    let connection: Connection | undefined
    try {
      connection = await createDBConnection()
      if (connection) await connection.runMigrations()
    } finally {
      if (connection) await connection.close()
    }
  }
}

function getHydraVersion(): string {
  return process.env.npm_package_version || 'UNKNOWN'
}

export async function cleanUp(): Promise<void> {
  debug(`Cleaning up the indexer...`)
  try {
    eventEmitter.emit(IndexerEvents.INDEXER_STOP)
  } catch (e) {
    // ignore
  }

  if (Container.has('RedisClientFactory')) {
    Container.get<RedisClientFactory>('RedisClientFactory').stop()
  }
  try {
    const connection = getConnection()
    if (connection && connection.isConnected) {
      debug('Closing the database connection')
      await connection.close()
    }
  } catch (e) {
    debug(`Error cleaning up: ${logError(e)}`)
  }
  debug(`Bye!`)
  process.exit()
}
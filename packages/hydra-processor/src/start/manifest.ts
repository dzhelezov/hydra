import YAML from 'yaml'
import YamlValidator from 'yaml-validator'
import fs from 'fs'
import path from 'path'
import semver from 'semver'
import { camelCase } from 'lodash'
import Debug from 'debug'
import { HandlerFunc } from './QueryEventProcessingPack'
import { PROCESSOR_PACKAGE_NAME, resolvePackageVersion } from '../util/utils'

export const STORE_CLASS_NAME = 'DatabaseManager'
export const CONTEXT_CLASS_NAME = 'SubstrateEvent'
export const EVENT_SUFFIX = 'Event'
export const CALL_SUFFIX = 'Call'

const debug = Debug('hydra-processor:manifest')

const manifestValidatorOptions = {
  structure: {
    version: 'string',
    'description?': 'string',
    'repository?': 'string',
    hydraVersion: 'string',
    dataSource: {
      kind: 'string',
      chain: 'string',
    },
    entities: ['string'],
    mappings: {
      mappingsModule: 'string',
      'imports?': ['string'],
      'blockInterval?': 'string',
      'eventHandlers?': [
        {
          event: 'string',
          'handler?': 'string',
        },
      ],
      'extrinsicHandlers?': [
        {
          extrinsic: 'string',
          'handler?': 'string',
          'success?': 'boolean',
        },
      ],
      'preBlockHooks?': ['string'],
      'postBlockHooks?': ['string'],
    },
  },

  onWarning: function (error: unknown, filepath: unknown) {
    throw new Error(`${filepath} has error: ${JSON.stringify(error)}`)
  },
}

export interface DataSource {
  kind: string
  chain: string
  indexerVersion: string
}

interface MappingsDefInput {
  mappingsModule: string
  blockInterval?: string
  imports?: string[]
  eventHandlers?: Array<{ event: string; handler?: string }>
  extrinsicHandlers?: Array<{
    extrinsic: string
    handler?: string
    success?: boolean
  }>
  preBlockHooks?: string[]
  postBlockHooks?: string[]
}

export interface MappingsDef {
  mappingsModule: Record<string, unknown>
  imports: string[]
  blockInterval: BlockInterval
  eventHandlers: Record<string, MappingHandler>
  extrinsicHandlers: Record<string, ExtrinsicHandler>
  preBlockHooks: MappingHandler[]
  postBlockHooks: MappingHandler[]
}

export interface BlockInterval {
  from: number
  to: number
}

export interface MappingHandler {
  blockInterval?: BlockInterval
  handlerFunc: HandlerFunc
  // argTypes: string[]
}

export interface ExtrinsicHandler extends MappingHandler {
  success: boolean
}

export interface ProcessorManifest {
  version: string
  hydraVersion: string
  entities: string[]
  description?: string
  repository?: string
  dataSource: DataSource
  mappings: MappingsDef
}

export function parseManifest(manifestLoc: string): ProcessorManifest {
  const validator = new YamlValidator(manifestValidatorOptions)
  validator.validate([manifestLoc])

  if (validator.report()) {
    throw new Error(
      `Failed to load the manifest file at location ${manifestLoc}: ${validator.logs.join(
        '\n'
      )}`
    )
  }
  const parsed = YAML.parse(fs.readFileSync(manifestLoc, 'utf8')) as {
    version: string
    entities: string[]
    hydraVersion: string
    description?: string
    repository?: string
    dataSource: DataSource
    mappings: MappingsDefInput
  }

  const { mappings, entities, hydraVersion } = parsed
  validateHydraVersion(hydraVersion)
  validate(mappings)

  return {
    ...parsed,
    entities: entities.map((e) => path.resolve(e.trim())),
    mappings: buildMappingsDef(mappings),
  }
}

function validate(parsed: MappingsDefInput): void {
  if (
    parsed.eventHandlers === undefined &&
    parsed.extrinsicHandlers === undefined
  ) {
    throw new Error(`At least one event or extrinsic handler must be defined`)
  }
}

function validateHydraVersion(hydraVersion: string) {
  const oursHydraVersion = resolvePackageVersion(PROCESSOR_PACKAGE_NAME)
  if (
    !semver.satisfies(oursHydraVersion, hydraVersion, {
      loose: true,
      includePrerelease: true,
    })
  ) {
    throw new Error(`The processor version ${oursHydraVersion} does \\
not satisfy the required manifest version ${hydraVersion}`)
  }
}

function buildMappingsDef(parsed: MappingsDefInput): MappingsDef {
  debug(`Parsed mappings def: ${JSON.stringify(parsed, null, 2)}`)
  const {
    mappingsModule,
    blockInterval,
    eventHandlers,
    extrinsicHandlers,
    preBlockHooks,
    postBlockHooks,
    imports,
  } = parsed

  if (mappingsModule === undefined) {
    throw new Error(`Cannot resolve mappings module ${mappingsModule}`)
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const resolvedModule = require(path.resolve(mappingsModule)) as Record<
    string,
    unknown
  >

  const parseHandler = function (
    def: (
      | {
          event: string
        }
      | { extrinsic: string }
    ) & {
      handler?: string
      suffix?: string
    }
  ): MappingHandler {
    const { handler, suffix } = def
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const input = (def as any).event || (def as any).extrinsic
    const name = handler || defaultName(input || '', suffix)

    return {
      handlerFunc: resolveHandler(resolvedModule, name),
    }
  }

  return {
    mappingsModule: resolvedModule,
    imports: [mappingsModule, ...(imports || [])].map((p) => path.resolve(p)),
    blockInterval: parseBlockInterval(blockInterval),
    eventHandlers: eventHandlers
      ? eventHandlers.reduce((acc, item) => {
          acc[item.event] = parseHandler(item)
          return acc
        }, {} as Record<string, MappingHandler>)
      : {},
    extrinsicHandlers: extrinsicHandlers
      ? extrinsicHandlers.reduce((acc, item) => {
          acc[item.extrinsic] = {
            success: item.success || true,
            ...parseHandler(item),
          }
          return acc
        }, {} as Record<string, ExtrinsicHandler>)
      : {},
    preBlockHooks: preBlockHooks
      ? preBlockHooks.map((name) => ({
          handlerFunc: resolveHandler(resolvedModule, name),
        }))
      : [],
    postBlockHooks: postBlockHooks
      ? postBlockHooks.map((name) => ({
          handlerFunc: resolveHandler(resolvedModule, name),
        }))
      : [],
  }
}

export function defaultName(input: string, suffix?: string): string {
  const [module, name] = input.split('.').map((s) => s.trim())

  return `${camelCase(module)}_${name}${suffix || ''}`
}

function resolveHandler(
  mappingsModule: Record<string, unknown>,
  name: string
): HandlerFunc {
  if (
    mappingsModule[name] === undefined ||
    typeof mappingsModule[name] !== 'function'
  ) {
    throw new Error(`Cannot resolve the handler ${name} in the mappings module`)
  }
  return mappingsModule[name] as HandlerFunc
}

export function parseBlockInterval(
  blockInterval: string | undefined
): BlockInterval {
  if (blockInterval === undefined) {
    return {
      from: 0,
      to: Number.MAX_SAFE_INTEGER,
    }
  }
  // accepted formats:
  //   [1,2]
  //   [,2]
  //   [2,]
  // eslint-disable-next-line no-useless-escape
  const parts = blockInterval.split(/[\[,\]]/).map((part) => part.trim())
  if (parts.length !== 4) {
    throw new Error(
      `Block interval ${blockInterval} does not match the expected format [number?, number?]`
    )
  }
  // the parts array must be in the form ["", from, to, ""]
  const from = parts[1].length > 0 ? Number.parseInt(parts[1]) : 0
  const to =
    parts[2].length > 0 ? Number.parseInt(parts[2]) : Number.MAX_SAFE_INTEGER

  return { from, to }
}

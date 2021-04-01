import { SubstrateEvent } from '@dzlzv/hydra-common'

export enum MappingType {
  EXTRINSIC = 'EXTRINSIC',
  EVENT = 'EVENT',
  BLOCK_PRE_HOOK = 'BLOCK_PRE_HOOK',
  BLOCK_POST_HOOK = 'BLOCK_POST_HOOK',
}

export interface EventContext {
  // TODO: update interfaces in hydra-common
  event: SubstrateEvent
  type: MappingType
}

export interface IEventQueue {
  nextBatch(size?: number): Promise<EventContext[]>
  hasNext(): boolean
  isEmpty(): boolean
  lastScannedBlock(): number

  start(): Promise<void>
  stop(): void
}

export interface FilterConfig {
  id: {
    gt: string
  }
  block: {
    gte: number
    lte: number
  }
  events: string[]
  extrinsics: string[]
  limit: number
}

export interface MappingFilter {
  blockInterval: { from: number; to: number }
  events: string[]
  extrinsics: string[]
  hasPreHooks: boolean
  hasPostHooks: boolean
}

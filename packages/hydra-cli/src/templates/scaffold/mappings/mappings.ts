import { Transfer } from '../generated/graphql-server/model'
import { Balances } from './generated/types'
import BN from 'bn.js'
import { EventContext, StoreContext } from '@dzlzv/hydra-common'

export async function balancesTransfer({
  store,
  event,
  block: { height, timestamp },
  extrinsic,
}: EventContext & StoreContext) {
  const transfer = new Transfer()
  const [from, to, value] = new Balances.TransferEvent(event).params
  transfer.from = from.toHuman()
  transfer.to = to.toHuman()
  transfer.value = value.toBn()
  transfer.tip = extrinsic ? new BN(extrinsic.tip.toString(10)) : new BN(0)
  transfer.insertedAt = new Date(timestamp)

  transfer.block = height
  transfer.comment = `Transferred ${transfer.value} from ${transfer.from} to ${transfer.to}`
  transfer.timestamp = new BN(timestamp)
  console.log(`Saving transfer: ${JSON.stringify(transfer, null, 2)}`)
  await store.save<Transfer>(transfer)
}

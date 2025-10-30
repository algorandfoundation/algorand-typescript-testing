import type { Application } from '@algorandfoundation/algorand-typescript'
import { Contract, log } from '@algorandfoundation/algorand-typescript'
import { abiCall } from '@algorandfoundation/algorand-typescript/arc4'
import type { ContractOne } from './circular-reference.algo'

export class ContractTwo extends Contract {
  test(appId: Application) {
    const result = abiCall<typeof ContractOne.prototype.receiver>({ appId, args: [appId] })
    return result.returnValue
  }

  receiver(appId: Application) {
    log(appId.id)
    return appId.id
  }
}

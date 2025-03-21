import type { gtxn, uint64 } from '@algorandfoundation/algorand-typescript'
import { arc4, assert, Global, op } from '@algorandfoundation/algorand-typescript'
import type { UintN64 } from '@algorandfoundation/algorand-typescript/arc4'
import { interpretAsArc4, methodSelector } from '@algorandfoundation/algorand-typescript/arc4'

export class AppExpectingEffects extends arc4.Contract {
  @arc4.abimethod()
  public create_group(assetCreate: gtxn.AssetConfigTxn, appCreate: gtxn.ApplicationCallTxn): readonly [uint64, uint64] {
    assert(assetCreate.createdAsset.id, 'expected asset created')
    assert(op.gaid(assetCreate.groupIndex) === assetCreate.createdAsset.id, 'expected correct asset id')
    assert(appCreate.createdApp.id, 'expected app created')
    assert(op.gaid(appCreate.groupIndex) === appCreate.createdApp.id, 'expected correct app id')

    return [assetCreate.createdAsset.id, appCreate.createdApp.id]
  }

  @arc4.abimethod()
  public log_group(appCall: gtxn.ApplicationCallTxn): void {
    assert(appCall.appArgs(0) === methodSelector('some_value()uint64'), 'expected correct method called')
    assert(appCall.numLogs === 1, 'expected logs')
    assert(interpretAsArc4<UintN64>(appCall.lastLog, 'log').native === (appCall.groupIndex + 1) * Global.groupSize)
  }
}

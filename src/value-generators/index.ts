import { Arc4ValueGenerator } from './arc4'
import { AvmValueGenerator } from './avm'
import { TxnValueGenerator } from './txn'

export class ValueGenerator extends AvmValueGenerator {
  txn: TxnValueGenerator
  arc4: Arc4ValueGenerator

  /** @internal */
  constructor() {
    super()
    this.txn = new TxnValueGenerator()
    this.arc4 = new Arc4ValueGenerator()
  }
}

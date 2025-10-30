import { Account, Bytes, Global, LogicSig, op, TransactionType, Txn, Uint64 } from '@algorandfoundation/algorand-typescript'

export default class HashedTimeLockedLogicSig extends LogicSig {
  program(): boolean {
    // Participants
    const sellerAddress = Bytes.fromBase32('6ZHGHH5Z5CTPCF5WCESXMGRSVK7QJETR63M3NY5FJCUYDHO57VTC')
    const buyerAddress = Bytes.fromBase32('7Z5PWO2C6LFNQFGHWKSK5H47IQP5OJW2M3HA2QPXTY3WTNP5NU2M')
    const seller = Account(sellerAddress)
    const buyer = Account(buyerAddress)

    // Contract parameters
    const feeLimit = Uint64(1000)
    const secretHash = Bytes.fromHex('2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b')
    const timeout = Uint64(3000)

    // Transaction conditions
    const isPayment = Txn.typeEnum === TransactionType.Payment
    const isFeeAcceptable = Txn.fee < feeLimit
    const isNoCloseTo = Txn.closeRemainderTo === Global.zeroAddress
    const isNoRekey = Txn.rekeyTo === Global.zeroAddress

    // Safety conditions
    const safetyConditions = isPayment && isNoCloseTo && isNoRekey

    // Seller receives payment if correct secret is provided
    const isToSeller = Txn.receiver === seller
    const isSecretCorrect = op.sha256(op.arg(0)) === secretHash
    const sellerReceives = isToSeller && isSecretCorrect

    // Buyer receives refund after timeout
    const isToBuyer = Txn.receiver === buyer
    const isAfterTimeout = Txn.firstValid > timeout
    const buyerReceivesRefund = isToBuyer && isAfterTimeout

    // Final contract logic
    return isFeeAcceptable && safetyConditions && (sellerReceives || buyerReceivesRefund)
  }
}

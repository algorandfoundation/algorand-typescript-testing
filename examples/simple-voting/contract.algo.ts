import type { Account, bytes, uint64 } from '@algorandfoundation/algorand-typescript'
import {
  assert,
  BaseContract,
  Bytes,
  GlobalState,
  gtxn,
  LocalState,
  op,
  TransactionType,
  Uint64,
} from '@algorandfoundation/algorand-typescript'

const VOTE_PRICE = Uint64(10_000)
export default class SimpleVotingContract extends BaseContract {
  topic = GlobalState({ initialValue: Bytes('default_topic'), key: Bytes('topic') })
  votes = GlobalState({ initialValue: Uint64(0), key: Bytes('votes') })
  voted = LocalState<uint64>()

  public approvalProgram(): uint64 {
    switch (op.Txn.applicationArgs(0)) {
      case Bytes('set_topic'): {
        this.setTopic(op.Txn.applicationArgs(1))
        return 1
      }
      case Bytes('vote'): {
        return this.vote(op.Txn.sender) ? 1 : 0
      }
      case Bytes('get_votes'): {
        return this.votes.value
      }
      default:
        return 0
    }
  }

  public clearStateProgram(): boolean {
    return true
  }

  private setTopic(topic: bytes): void {
    this.topic.value = topic
  }

  private vote(voter: Account): boolean {
    assert(op.Global.groupSize === 2)
    assert(gtxn.PaymentTxn(1).amount === VOTE_PRICE)
    assert(op.GTxn.amount(1) === VOTE_PRICE)
    assert(op.GTxn.typeEnum(1) === TransactionType.Payment)

    if (this.voted(voter).hasValue) {
      return false
    }
    this.votes.value = this.votes.value + 1
    this.voted(voter).value = Uint64(1)
    return true
  }
}

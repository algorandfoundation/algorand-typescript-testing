import { Bytes, Uint64 } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext, toExternalValue } from '@algorandfoundation/algorand-typescript-testing'
import { DynamicArray, Uint8 } from '@algorandfoundation/algorand-typescript/arc4'
import nacl from 'tweetnacl'
import { afterEach, describe, expect, it } from 'vitest'
import { VotingRoundApp } from './contract.algo'

describe('VotingRoundApp', () => {
  const ctx = new TestExecutionContext()

  const boostrapMinBalanceReq = Uint64(287100)
  const voteMinBalanceReq = Uint64(21300)
  const tallyBoxSize = 208
  const keyPair = nacl.sign.keyPair()
  const voteId = ctx.any.string()

  const createContract = () => {
    const contract = ctx.contract.create(VotingRoundApp)
    const snapshotPublicKey = Bytes<32>(keyPair.publicKey)
    const metadataIpfsCid = ctx.any.string(16)
    const startTime = ctx.any.uint64(Date.now() - 10_000, Date.now())
    const endTime = ctx.any.uint64(Date.now() + 10_000, Date.now() + 100_000)
    const optionCounts = new DynamicArray<Uint8>(
      ...Array(13)
        .fill(0)
        .map(() => new Uint8(2)),
    )
    const quorum = ctx.any.uint64()
    const nftImageUrl = ctx.any.string(64)
    contract.create(voteId, snapshotPublicKey, metadataIpfsCid, startTime, endTime, optionCounts, quorum, nftImageUrl)
    return contract
  }

  afterEach(() => {
    ctx.reset()
  })

  it('shoulld be able to bootstrap', () => {
    const contract = createContract()
    const app = ctx.ledger.getApplicationForContract(contract)
    contract.bootstrap(ctx.any.txn.payment({ receiver: app.address, amount: boostrapMinBalanceReq }))

    expect(contract.isBootstrapped.value).toEqual(true)
    expect(contract.tallyBox.value).toEqual(Bytes.fromHex('00'.repeat(tallyBoxSize)))
  })

  it('should be able to get pre conditions', () => {
    const contract = createContract()
    const app = ctx.ledger.getApplicationForContract(contract)
    contract.bootstrap(ctx.any.txn.payment({ receiver: app.address, amount: boostrapMinBalanceReq }))

    const account = ctx.any.account()
    const signature = nacl.sign.detached(toExternalValue(account.bytes), keyPair.secretKey)
    ctx.txn.createScope([ctx.any.txn.applicationCall({ sender: account })]).execute(() => {
      const preconditions = contract.getPreconditions(Bytes(signature))

      expect(preconditions.is_allowed_to_vote).toEqual(1)
      expect(preconditions.is_voting_open).toEqual(1)
      expect(preconditions.has_already_voted).toEqual(0)
      expect(preconditions.current_time).toEqual(ctx.txn.activeGroup.latestTimestamp)
    })
  })

  it('should be able to vote', () => {
    const contract = createContract()
    const app = ctx.ledger.getApplicationForContract(contract)
    contract.bootstrap(ctx.any.txn.payment({ receiver: app.address, amount: boostrapMinBalanceReq }))

    const account = ctx.any.account()
    const signature = nacl.sign.detached(toExternalValue(account.bytes), keyPair.secretKey)
    const answerIds = new DynamicArray<Uint8>(
      ...Array(13)
        .fill(0)
        .map(() => new Uint8(Math.ceil(Math.random() * 10) % 2)),
    )

    ctx.txn.createScope([ctx.any.txn.applicationCall({ appId: app, sender: account })]).execute(() => {
      contract.vote(ctx.any.txn.payment({ receiver: app.address, amount: voteMinBalanceReq }), Bytes(signature), answerIds)

      expect(contract.votesByAccount(account).value.bytes).toEqual(answerIds.bytes)
      expect(contract.voterCount.value).toEqual(13)
    })
  })

  it('should be able to close', () => {
    const contract = createContract()
    const app = ctx.ledger.getApplicationForContract(contract)
    contract.bootstrap(ctx.any.txn.payment({ receiver: app.address, amount: boostrapMinBalanceReq }))

    contract.close()

    expect(contract.closeTime.value).toEqual(ctx.txn.lastGroup.latestTimestamp)
    expect(contract.nftAsset.value.name).toEqual(`[VOTE RESULT] ${voteId}`)
    expect(contract.nftAsset.value.unitName).toEqual('VOTERSLT')
  })
})

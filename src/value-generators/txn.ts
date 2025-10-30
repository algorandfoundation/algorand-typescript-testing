import type { Application as ApplicationType, BaseContract as BaseContractType, gtxn } from '@algorandfoundation/algorand-typescript'
import { lazyContext } from '../context-helpers/internal-context'
import { InternalError } from '../errors'
import { BaseContract } from '../impl/base-contract'
import { ApplicationCls } from '../impl/reference'
import type { ApplicationCallTransactionFields, TxnFields } from '../impl/transactions'
import {
  ApplicationCallTransaction,
  AssetConfigTransaction,
  AssetFreezeTransaction,
  AssetTransferTransaction,
  KeyRegistrationTransaction,
  PaymentTransaction,
} from '../impl/transactions'

export class TxnValueGenerator {
  /**
   * Generates a random application call transaction with the specified fields.
   * @param {ApplicationCallTransactionFields} [fields] - The fields for the application call transaction where `appId` value can be instance of Application or BaseContract.
   * @returns {ApplicationCallTransaction} - A random application call transaction.
   */
  applicationCall(
    fields?: Partial<Omit<ApplicationCallTransactionFields, 'appId'> & { appId: ApplicationType | BaseContractType }>,
  ): ApplicationCallTransaction {
    const params = fields ?? {}
    let appId =
      params.appId instanceof ApplicationCls
        ? params.appId
        : params.appId instanceof BaseContract
          ? lazyContext.ledger.getApplicationForContract(params.appId)
          : undefined
    if (appId && !lazyContext.ledger.applicationDataMap.has(appId.id)) {
      throw new InternalError(`Application ID ${appId.id} not found in test context`)
    }
    if (!appId) {
      appId = lazyContext.any.application()
    }

    return ApplicationCallTransaction.create({ ...params, appId })
  }

  /**
   * Generates a random payment transaction with the specified fields.
   * @param {TxnFields<gtxn.PaymentTxn>} [fields] - The fields for the payment transaction.
   * @returns {PaymentTransaction} - A random payment transaction.
   */
  payment(fields?: TxnFields<gtxn.PaymentTxn>): PaymentTransaction {
    return PaymentTransaction.create(fields ?? {})
  }

  /**
   * Generates a random key registration transaction with the specified fields.
   * @param {TxnFields<gtxn.KeyRegistrationTxn>} [fields] - The fields for the key registration transaction.
   * @returns {KeyRegistrationTransaction} - A random key registration transaction.
   */
  keyRegistration(fields?: TxnFields<gtxn.KeyRegistrationTxn>): KeyRegistrationTransaction {
    return KeyRegistrationTransaction.create(fields ?? {})
  }

  /**
   * Generates a random asset configuration transaction with the specified fields.
   * @param {TxnFields<gtxn.AssetConfigTxn>} [fields] - The fields for the asset configuration transaction.
   * @returns {AssetConfigTransaction} - A random asset configuration transaction.
   */
  assetConfig(fields?: TxnFields<gtxn.AssetConfigTxn>): AssetConfigTransaction {
    return AssetConfigTransaction.create(fields ?? {})
  }

  /**
   * Generates a random asset transfer transaction with the specified fields.
   * @param {TxnFields<gtxn.AssetTransferTxn>} [fields] - The fields for the asset transfer transaction.
   * @returns {AssetTransferTransaction} - A random asset transfer transaction.
   */
  assetTransfer(fields?: TxnFields<gtxn.AssetTransferTxn>): AssetTransferTransaction {
    return AssetTransferTransaction.create(fields ?? {})
  }

  /**
   * Generates a random asset freeze transaction with the specified fields.
   * @param {TxnFields<gtxn.AssetFreezeTxn>} [fields] - The fields for the asset freeze transaction.
   * @returns {AssetFreezeTransaction} - A random asset freeze transaction.
   */
  assetFreeze(fields?: TxnFields<gtxn.AssetFreezeTxn>): AssetFreezeTransaction {
    return AssetFreezeTransaction.create(fields ?? {})
  }
}

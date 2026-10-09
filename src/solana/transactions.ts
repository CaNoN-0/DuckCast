/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Turns Panta's unsigned outputs into wallet-signable Solana transactions.
 *
 * Panta returns two shapes (docs.panta.market/guides/how-it-works):
 *  - primary buys / claims: an ordered instruction list + recentBlockhash
 *    -> we compile a v0 VersionedTransaction with the user's wallet as fee payer
 *  - market creation: a base64 serialized VersionedTransaction
 *    -> we deserialize it unchanged (register verifies accounts and fees)
 */

import { Buffer } from 'buffer';
import {
  Connection,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction
} from '@solana/web3.js';
import type { PantaInstruction } from '../services/pantaApi';

/** Minimal surface of the Reown AppKit Solana provider that we rely on. */
export interface SolanaSigner {
  signAndSendTransaction?: (tx: VersionedTransaction) => Promise<string>;
  signTransaction?: <T extends VersionedTransaction>(tx: T) => Promise<T>;
  signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
}

export function compileInstructions(
  instructions: PantaInstruction[],
  recentBlockhash: string,
  payer: string
): VersionedTransaction {
  const ixs = instructions.map(
    (ix) =>
      new TransactionInstruction({
        programId: new PublicKey(ix.programId),
        keys: ix.accounts.map((a) => ({
          pubkey: new PublicKey(a.pubkey),
          isSigner: a.isSigner,
          isWritable: a.isWritable
        })),
        data: Buffer.from(ix.data, 'base64')
      })
  );

  const message = new TransactionMessage({
    payerKey: new PublicKey(payer),
    recentBlockhash,
    instructions: ixs
  }).compileToV0Message();

  return new VersionedTransaction(message);
}

export function deserializeTransaction(base64: string): VersionedTransaction {
  return VersionedTransaction.deserialize(Buffer.from(base64, 'base64'));
}

export function isUserRejection(err: any): boolean {
  const msg = String(err?.message || err || '').toLowerCase();
  return (
    err?.code === 4001 ||
    msg.includes('user rejected') ||
    msg.includes('rejected the request') ||
    msg.includes('user denied') ||
    msg.includes('cancelled') ||
    msg.includes('canceled')
  );
}

/**
 * Asks the wallet to sign, then broadcasts. Prefers the wallet's own
 * signAndSendTransaction (works for Phantom, Solflare, Backpack, WalletConnect);
 * falls back to signTransaction + sendRawTransaction on our RPC.
 */
export async function signAndBroadcast(
  signer: SolanaSigner,
  tx: VersionedTransaction,
  connection: Connection
): Promise<string> {
  if (signer.signAndSendTransaction) {
    try {
      return await signer.signAndSendTransaction(tx);
    } catch (err) {
      if (isUserRejection(err) || !signer.signTransaction) throw err;
      // Some wallets expose but don't implement signAndSend; fall through.
    }
  }
  if (!signer.signTransaction) {
    throw new Error('Connected wallet cannot sign Solana transactions.');
  }
  const signed = await signer.signTransaction(tx);
  return connection.sendRawTransaction(signed.serialize(), { skipPreflight: false, maxRetries: 3 });
}

export async function confirmSignature(
  connection: Connection,
  signature: string,
  blockhash: string,
  lastValidBlockHeight: number
): Promise<void> {
  const result = await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
  if (result.value.err) {
    throw new Error(`Transaction failed on-chain: ${JSON.stringify(result.value.err)}`);
  }
}

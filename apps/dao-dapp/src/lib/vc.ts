/**
 * Verifiable Credential utilities - Phase 3 SSI Learning
 *
 * Creates, hashes, and verifies VCs using Ethereum signatures.
 * Credential hash is stored on-chain for revocation lookup.
 */

import type { Hex } from 'viem'
import { sha256Hex } from './hash'

/** Minimal Verifiable Credential payload (before proof) */
export interface CredentialPayload {
  '@context': string[]
  type: string[]
  issuer: string
  issuanceDate: string
  credentialSubject: {
    id: string
    [key: string]: unknown
  }
}

/** Proof with Ethereum signature */
export interface CredentialProof {
  type: string
  created: string
  verificationMethod: string
  proofPurpose: string
  messageHash: Hex
  signature: Hex
}

/** Full Verifiable Credential with proof */
export interface VerifiableCredential extends CredentialPayload {
  proof: CredentialProof
}

/**
 * Create a credential payload (without proof).
 * Caller signs the hash and adds the proof.
 */
export function createCredentialPayload(
  issuerDid: string,
  subjectDid: string,
  claims: Record<string, unknown> = {}
): CredentialPayload {
  return {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'SimpleAttestation'],
    issuer: issuerDid,
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: subjectDid,
      ...claims
    }
  }
}

/**
 * Canonical JSON serialize (sorted keys) for deterministic hashing
 */
function canonicalString(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj)
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalString).join(',') + ']'
  }
  const sorted = Object.keys(obj as object).sort()
  const pairs = sorted.map(k => {
    const val = (obj as Record<string, unknown>)[k]
    return JSON.stringify(k) + ':' + canonicalString(val)
  })
  return '{' + pairs.join(',') + '}'
}

/**
 * Compute the credential hash (SHA-256 of canonical payload, as bytes32).
 * This is what we store on-chain and sign.
 */
export async function credentialHash(payload: CredentialPayload): Promise<Hex> {
  const canonical = canonicalString(payload)
  return await sha256Hex(canonical)
}

/**
 * Create the message that will be signed (Ethereum signed message prefix).
 * The hash is passed as hex string for signMessage compatibility.
 */
export function credentialHashAsMessage(hash: Hex): string {
  return hash
}

/**
 * Build the full VC with proof (after signing)
 */
export function buildSignedCredential(
  payload: CredentialPayload,
  messageHash: Hex,
  signature: Hex
): VerifiableCredential {
  return {
    ...payload,
    proof: {
      type: 'EthereumEoaSignature2020',
      created: new Date().toISOString(),
      verificationMethod: `${payload.issuer}#controller`,
      proofPurpose: 'assertionMethod',
      messageHash,
      signature
    }
  }
}

/**
 * Extract the credential hash from a VC for on-chain lookup.
 * Recomputes from payload (proof is excluded from hash).
 */
export async function getCredentialHashFromVC(
  vc: VerifiableCredential
): Promise<Hex> {
  const { proof: _, ...payload } = vc
  return credentialHash(payload as CredentialPayload)
}

/**
 * Verify a VC's structure and that it has a valid proof.
 * Does NOT check revocation - that must be done on-chain.
 */
export function validateVCStructure(vc: unknown): vc is VerifiableCredential {
  if (!vc || typeof vc !== 'object') return false
  const o = vc as Record<string, unknown>
  if (!Array.isArray(o['@context']) || !o['@context'].includes('https://www.w3.org/2018/credentials/v1'))
    return false
  if (!Array.isArray(o.type) || !o.type.includes('VerifiableCredential')) return false
  if (typeof o.issuer !== 'string') return false
  if (!o.credentialSubject || typeof o.credentialSubject !== 'object') return false
  const subj = o.credentialSubject as Record<string, unknown>
  if (typeof subj.id !== 'string') return false
  const proof = o.proof as Record<string, unknown> | undefined
  if (!proof || typeof proof.messageHash !== 'string' || typeof proof.signature !== 'string') return false
  return true
}

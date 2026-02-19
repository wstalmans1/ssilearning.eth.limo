/**
 * Build a minimal DID document (W3C DID Core) for ethr method.
 * https://www.w3.org/TR/did-core/
 */
export function buildDIDDocument(did: string, options?: { service?: string; note?: string }): string {
  const doc: Record<string, unknown> = {
    '@context': ['https://www.w3.org/ns/did/v1'],
    id: did,
    verificationMethod: [
      {
        id: `${did}#controller`,
        type: 'EthereumAddress',
        controller: did,
        blockchainAccountId: did.replace('did:ethr:', 'eip155:11155111:')
      }
    ],
    authentication: [`${did}#controller`]
  }

  if (options?.service) {
    doc.service = [
      {
        id: `${did}#service-1`,
        type: 'LinkedDomains',
        serviceEndpoint: options.service
      }
    ]
  }

  if (options?.note) {
    doc.description = options.note
  }

  return JSON.stringify(doc, null, 2)
}

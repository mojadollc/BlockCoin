declare module 'tronweb' {
  interface TronContractInstance {
    balanceOf(address: string): { call(): Promise<bigint> }
    decimals(): { call(): Promise<number> }
    symbol(): { call(): Promise<string> }
    name(): { call(): Promise<string> }
    transfer(to: string, amount: bigint): { send(): Promise<string> }
  }

  interface TronTransaction {
    txID: string
    blockNumber?: number
    ret?: Array<{ contractRet: string }>
  }

  interface TronTransactionInfo {
    id: string
    blockNumber: number
    receipt?: { result: string }
  }

  class TronWeb {
    constructor(options: { fullHost?: string; headers?: Record<string, string>; privateKey?: string })
    trx: {
      getBalance(address: string): Promise<number>
      getTransaction(txHash: string): Promise<TronTransaction>
      getTransactionInfo(txHash: string): Promise<TronTransactionInfo>
    }
    contract(): { at(address: string): Promise<TronContractInstance> }
    address: {
      fromPrivateKey(pk: string): string
      isAddress(addr: string): boolean
    }
    toSun(amount: number): number
    fromSun(sun: number): number
    ready: boolean
    setPrivateKey(pk: string): void
  }

  export = TronWeb
}

export type returnCreateKeys = {
    privateKey:string,
    publicKey:string
}

export type parametersOfEncrypt = {
  text: string,
  publicKey?: string
}

export type parametersOfDecrypt = {
  text: string,
  privateKey?: string
}

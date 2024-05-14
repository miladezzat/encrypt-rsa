export type returnCreateKeys = {
    privateKey:string,
    publicKey:string
}

export type parametersOfEncrypt = {
  text: string,
  privateKey?: string
}

export type parametersOfDecrypt = {
  text: string,
  publicKey?: string
}

export type returnCreateKeys = {
    privateKey: string,
    publicKey: string
}

export type parametersOfEncrypt = {
    text: string,
    publicKey?: string
}

export type parametersOfDecrypt = {
    text: string,
    privateKey?: string
}

export type parametersOfEncryptPrivate = {
    text: string,
    privateKey?: string
}

export type parametersOfDecryptPublic = {
    text: string,
    publicKey?: string
}

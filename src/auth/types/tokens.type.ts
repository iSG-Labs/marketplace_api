export type Tokens = {
    accessToken: string
    refreshToken: string
}

export type User = {
    id: string
    profile: {
        firstName: string
        lastName: string
        address: string
        avatarUrl: string
    }
    email: string
    token: Tokens
}

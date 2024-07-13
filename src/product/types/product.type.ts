export type Product = {
    id: string
    name: string
    description: string
    photo: string
    location: string
    sellerId: string
    startingBid: number
    currentBid: number
    status: string
    auctionId: string
    createdAt: Date
    updatedAt: Date
}

export type TopBidder = {
    id: string
    profile: {
        firstName: string
        lastName: string
        address: string
        avatarUrl: string
    }
    email: string
}

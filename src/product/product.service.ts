import { ForbiddenException, Injectable } from '@nestjs/common'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { PrismaService } from 'src/prisma/prisma.service'
import { ProductDto } from 'src/auth/dto'
import { Product } from './types/'

@Injectable()
export class ProductService {
    constructor(private prismaService: PrismaService) {}

    async createProduct(userId: string, dto: ProductDto): Promise<Product> {
        const product = await this.prismaService.product
            .create({
                data: {
                    name: dto.name,
                    description: dto.description,
                    photo: dto.photo,
                    location: dto.location,
                    sellerId: userId,
                    status: 'Unsold',
                    auction: {
                        connect: {
                            id: dto.auctionId,
                        },
                    },
                },
            })
            .catch((error) => {
                if (error instanceof PrismaClientKnownRequestError) {
                    if (error.code === 'P2002') {
                        throw new ForbiddenException('Product already exists.')
                    }
                }
                throw error
            })

        return product
    }

    async getAllProducts(): Promise<Array<Product>> {
        return await this.prismaService.product.findMany()
    }

    async bid(userId: string, productId: string): Promise<Boolean> {
        const current_bid = await this.getCurrentBidOfProduct(productId)
        const bid_amount = current_bid + 250

        const bid = await this.prismaService.bid
            .findFirstOrThrow({
                where: {
                    userId: userId,
                    productId: productId,
                },
            })
            .catch(async (error) => {
                if (error instanceof PrismaClientKnownRequestError) {
                    if (error.code !== 'P2025') {
                        throw new ForbiddenException('Not able to place bid.')
                    }
                }
            })

        // if bid exists
        if (bid) {
            await this.prismaService.bid.updateMany({
                where: {
                    userId: userId,
                    productId: productId,
                },
                data: {
                    amount: bid_amount,
                },
            })
        } else {
            await this.prismaService.bid.create({
                data: {
                    amount: bid_amount,
                    product: {
                        connect: {
                            id: productId,
                        },
                    },
                    user: {
                        connect: {
                            id: userId,
                        },
                    },
                },
            })
        }
        await this.updateProductCurrentBid(productId, bid_amount)
        return true
    }

    async updateProductCurrentBid(
        productId: string,
        bid: number,
    ): Promise<Boolean> {
        await this.prismaService.product.update({
            data: {
                currentBid: bid,
            },
            where: {
                id: productId,
            },
        })
        return true
    }

    async getCurrentBidOfProduct(productId: string) {
        const product = await this.prismaService.product
            .findFirstOrThrow({
                where: {
                    id: productId,
                },
            })
            .catch((error) => {
                if (error instanceof PrismaClientKnownRequestError) {
                    // product not found
                    if (error.code === 'P2025') {
                        throw new ForbiddenException('Product not found')
                    }
                    throw error
                }
            })

        if (product) return product.currentBid
    }
}

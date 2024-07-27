import { ForbiddenException, Injectable } from '@nestjs/common'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary'
import { v4 as uuidv4 } from 'uuid'
import { PrismaService } from 'src/prisma/prisma.service'
import { ProductDto, SpeedUpBidDto } from './dto'
import { Product, TopBidder } from './types/'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class ProductService {
    constructor(
        private prismaService: PrismaService,
        private configService: ConfigService,
    ) {}

    async createProduct(
        userId: string,
        file: Express.Multer.File,
        dto: ProductDto,
    ): Promise<Product> {
        const uploadRes = await this.uploadFile(file)
        if (!uploadRes) throw new ForbiddenException('Not able to upload file')

        const product = await this.prismaService.product
            .create({
                data: {
                    name: dto.name,
                    description: dto.description,
                    photo: uploadRes.secure_url,
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

    async findOne(productId: string) {
        return await this.prismaService.product
            .findFirst({
                where: {
                    id: productId,
                },
            })
            .catch((error) => {
                throw error
            })
    }

    async speedUpBid(
        userId: string,
        productId: string,
        dto: SpeedUpBidDto,
    ): Promise<Boolean> {
        await this.prismaService.bid.updateMany({
            where: {
                userId: userId,
                productId: productId,
            },
            data: {
                increment_amount: dto.amount,
            },
        })

        return true
    }

    async bid(userId: string, productId: string): Promise<Boolean> {
        const current_bid = await this.getCurrentBidOfProduct(productId)
        const bid_amount = current_bid + 250

        // check if auction closed or not
        const product = await this.prismaService.product.findFirst({
            where: {
                id: productId,
                auction: {
                    status: 'Ongoing',
                },
            },
        })

        if (!product) {
            throw new ForbiddenException('Auction ended')
        }

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
                    amount: current_bid + bid.increment_amount,
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

    async getWinner(productId: string): Promise<TopBidder> {
        const topBid = await this.prismaService.bid
            .findFirstOrThrow({
                where: {
                    productId: productId,
                    isWinner: true,
                },
            })
            .catch(async (error) => {
                if (error instanceof PrismaClientKnownRequestError) {
                    if (error.code !== 'P2025') {
                        throw new ForbiddenException('No bid found')
                    }
                }
            })

        if (!topBid)
            return {
                id: '',
                email: '',
                profile: {
                    firstName: '',
                    lastName: '',
                    address: '',
                    avatarUrl: '',
                },
            }

        const winner = await this.prismaService.user.findFirst({
            where: {
                id: topBid.userId,
            },
        })

        return {
            id: winner.id,
            profile: winner.profile,
            email: winner.email,
        }
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

    // file upload
    async uploadFile(
        file: Express.Multer.File,
    ): Promise<UploadApiResponse | void> {
        //  Configuration
        cloudinary.config({
            cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
            api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
            api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
        })

        const base64String = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
        const uploadResult = await cloudinary.uploader
            .upload(base64String, {
                folder: 'products',
                public_id: uuidv4(),
                resource_type: 'auto',
            })
            .catch((error) => {
                console.log(error)
            })

        return uploadResult
    }
}

import { ForbiddenException, Injectable } from '@nestjs/common'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { PrismaService } from 'src/prisma/prisma.service'
import { ProductDto } from 'src/auth/dto'
import { Product } from './types/'

@Injectable()
export class ProductService {
    constructor(private prismaService: PrismaService) {}

    async createProductLocal(dto: ProductDto): Promise<Product> {
        const product = await this.prismaService.product
            .create({
                data: {
                    name: dto.name,
                    description: dto.description,
                    photo: dto.photo,
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

        return {
            id: product.id,
            name: product.name,
            description: product.description,
            photo: product.photo,
        }
    }
}

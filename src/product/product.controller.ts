import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
} from '@nestjs/common'
import { ProductDto } from 'src/auth/dto'
import { GetCurrentUserId } from 'src/common/decorators'
import { ProductService } from './product.service'
import { Product } from './types/'

@Controller('product')
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    createProduct(
        @GetCurrentUserId() userId: string,
        @Body() dto: ProductDto,
    ): Promise<Product> {
        return this.productService.createProduct(userId, dto)
    }

    @Get('all')
    @HttpCode(HttpStatus.CREATED)
    viewProducts(): Promise<Array<Product>> {
        return this.productService.getAllProducts()
    }
}

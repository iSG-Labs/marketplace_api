import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ProductDto } from 'src/auth/dto'
// import { Public } from 'src/common/decorators'
import { ProductService } from './product.service'
import { Product } from './types/'

@Controller('product')
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    @Post('create')
    @HttpCode(HttpStatus.CREATED)
    signupLocal(@Body() dto: ProductDto): Promise<Product> {
        return this.productService.createProductLocal(dto)
    }
}

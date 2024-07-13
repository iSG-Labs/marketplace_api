import {
    Body,
    Controller,
    FileTypeValidator,
    Get,
    HttpCode,
    HttpStatus,
    MaxFileSizeValidator,
    Param,
    ParseFilePipe,
    Post,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ProductDto, SpeedUpBidDto } from './dto'
import { GetCurrentUserId } from 'src/common/decorators'
import { ProductService } from './product.service'
import { Product, TopBidder } from './types/'

@Controller('product')
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileInterceptor('photo'))
    createProduct(
        @GetCurrentUserId() userId: string,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 7000 }),
                    new FileTypeValidator({ fileType: 'image/jpeg' }),
                ],
            }),
        )
        photo: Express.Multer.File,
        @Body() dto: ProductDto,
    ): Promise<Product> {
        return this.productService.createProduct(userId, photo, dto)
    }

    @Get('all')
    @HttpCode(HttpStatus.CREATED)
    viewProducts(): Promise<Array<Product>> {
        return this.productService.getAllProducts()
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.productService.findOne(id)
    }

    @Post('bid/:id')
    @HttpCode(HttpStatus.OK)
    bid(
        @GetCurrentUserId() userId: string,
        @Param('id') productId: string,
    ): Promise<Boolean> {
        return this.productService.bid(userId, productId)
    }

    @Get('winner/:id')
    @HttpCode(HttpStatus.OK)
    getWinner(@Param('id') productId: string): Promise<TopBidder> {
        return this.productService.getWinner(productId)
    }

    @Post('bid/speed_up_bid/:id')
    @HttpCode(HttpStatus.OK)
    speedUpBid(
        @GetCurrentUserId() userId: string,
        @Param('id') productId: string,
        @Body() dto: SpeedUpBidDto,
    ): Promise<Boolean> {
        return this.productService.speedUpBid(userId, productId, dto)
    }
}

import { IsNotEmpty, IsNumber, IsString } from 'class-validator'

export class ProductDto {
    @IsNotEmpty()
    @IsString()
    name: string

    @IsNotEmpty()
    @IsString()
    description: string

    @IsNotEmpty()
    @IsString()
    location: string

    @IsNotEmpty()
    @IsString()
    auctionId: string
}

export class SpeedUpBidDto {
    @IsNotEmpty()
    @IsNumber()
    amount: number
}

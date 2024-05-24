import { IsNotEmpty, IsString } from 'class-validator'

export class CreateAuctionDto {
    @IsNotEmpty()
    @IsString()
    title: string

    @IsNotEmpty()
    @IsString()
    description: string
}

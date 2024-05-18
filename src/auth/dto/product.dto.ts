import { IsNotEmpty, IsString } from 'class-validator'

export class ProductDto {
    @IsNotEmpty()
    @IsString()
    name: string

    @IsNotEmpty()
    @IsString()
    description: string

    @IsNotEmpty()
    @IsString()
    photo: string
}

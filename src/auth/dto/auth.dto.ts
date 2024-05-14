import { IsNotEmpty, IsString } from 'class-validator'

export class AuthDto {
    @IsNotEmpty()
    @IsString()
    email: string

    @IsNotEmpty()
    @IsString()
    password: string
}

export class SignupAuthDto extends AuthDto {
    @IsNotEmpty()
    @IsString()
    firstname: string

    @IsNotEmpty()
    @IsString()
    lastname: string
}

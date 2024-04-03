import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common'
import { Request } from 'express'
import { AuthGuard } from '@nestjs/passport'
import { AuthService } from './auth.service'
import { AuthDto } from './dto'
import { Tokens } from './types'

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('local/signup')
    @HttpCode(HttpStatus.CREATED)
    signupLocal(@Body() dto: AuthDto): Promise<Tokens> {
        return this.authService.signupLocal(dto)
    }

    @Post('local/signin')
    @HttpCode(HttpStatus.OK)
    signinLocal(@Body() dto: AuthDto): Promise<Tokens> {
        return this.authService.signinLocal(dto)
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('signout')
    @HttpCode(HttpStatus.OK)
    signout(@Req() req: Request) {
        const user = req.user
        return this.authService.signout(user['sub'])
    }

    @UseGuards(AuthGuard('jwt-refresh'))
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    refreshToken(@Req() req: Request): Promise<Tokens> {
        const user = req.user
        return this.authService.refreshToken(user['sub'], user['refreshToken'])
    }
}

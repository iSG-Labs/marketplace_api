import { ForbiddenException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { PrismaService } from 'src/prisma/prisma.service'
import { AuthDto } from './dto'
import { Tokens } from './types'

@Injectable()
export class AuthService {
    constructor(
        private prismaService: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {}

    async signupLocal(dto: AuthDto): Promise<Tokens> {
        const hash = await this.hashData(dto.password)
        const user = await this.prismaService.user
            .create({
                data: {
                    email: dto.email,
                    hash,
                },
            })
            .catch((error) => {
                if (error instanceof PrismaClientKnownRequestError) {
                    if (error.code === 'P2002') {
                        throw new ForbiddenException('Credentials incorrect')
                    }
                }
                throw error
            })

        const tokens = await this.getTokens(user.id, user.email)
        await this.updateRtHash(user.id, tokens.refreshToken)

        return tokens
    }

    async signinLocal(dto: AuthDto): Promise<Tokens> {
        const user = await this.prismaService.user.findUnique({
            where: {
                email: dto.email,
            },
        })

        if (!user) throw new ForbiddenException('Access Denied')

        const passwordMatches = await bcrypt.compare(dto.password, user.hash)
        if (!passwordMatches) throw new ForbiddenException('Access Denied')

        const tokens = await this.getTokens(user.id, user.email)
        await this.updateRtHash(user.id, tokens.refreshToken)

        return tokens
    }

    signout() {}

    refreshToken() {}

    async updateRtHash(userId: string, refreshToken: string) {
        const hash = await this.hashData(refreshToken)
        await this.prismaService.user.update({
            where: {
                id: userId,
            },
            data: {
                hashedRt: hash,
            },
        })
    }

    hashData(data: string) {
        return bcrypt.hash(data, 10)
    }

    async getTokens(userId: string, email: string): Promise<Tokens> {
        const [at, rt] = await Promise.all([
            this.jwtService.signAsync(
                {
                    sub: userId,
                    email,
                },
                {
                    secret: this.configService.get<string>('ACCESS_SECRET'),
                    expiresIn: '15m',
                },
            ),
            this.jwtService.signAsync(
                {
                    sub: userId,
                    email,
                },
                {
                    secret: this.configService.get<string>('REFRESH_SECRET'),
                    expiresIn: '7d',
                },
            ),
        ])

        return {
            accessToken: at,
            refreshToken: rt,
        }
    }
}
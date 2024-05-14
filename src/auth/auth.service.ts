import { ForbiddenException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { PrismaService } from 'src/prisma/prisma.service'
import { AuthDto, SignupAuthDto } from './dto'
import { Tokens, User } from './types'

@Injectable()
export class AuthService {
    constructor(
        private prismaService: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {}

    async signupLocal(dto: SignupAuthDto): Promise<Tokens> {
        const hash = await this.hashData(dto.password)
        const user = await this.prismaService.user
            .create({
                data: {
                    email: dto.email,
                    firstname: dto.firstname,
                    lastname: dto.lastname,
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

    async signinLocal(dto: AuthDto): Promise<User> {
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

        return {
            id: user.id,
            name: user.email,
            email: user.email,
            token: tokens,
        }
    }

    async signout(userId: string): Promise<boolean> {
        await this.prismaService.user.updateMany({
            where: {
                id: userId,
                hashedRt: {
                    not: null,
                },
            },
            data: {
                hashedRt: null,
            },
        })

        return true
    }

    async refreshToken(userId: string, refreshToken: string): Promise<Tokens> {
        const user = await this.prismaService.user.findUnique({
            where: {
                id: userId,
            },
        })
        if (!user || !user.hashedRt)
            throw new ForbiddenException('Access Denied')

        const rtMatches = await bcrypt.compare(user.hashedRt, refreshToken)
        if (!rtMatches) throw new ForbiddenException('Access Denied')

        const tokens = await this.getTokens(user.id, user.email)
        await this.updateRtHash(user.id, tokens.refreshToken)

        return tokens
    }

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

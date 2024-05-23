import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { UserUpdateDto } from './dto'

@Injectable()
export class UserService {
    constructor(private prismaService: PrismaService) {}

    async updateUser(userId: string, dto: UserUpdateDto): Promise<boolean> {
        await this.prismaService.user.updateMany({
            where: {
                id: userId,
            },
            data: {
                profile: {
                    ...dto,
                },
            },
        })

        return true
    }
}

import * as moment from 'moment-timezone'
import { ForbiddenException, Injectable } from '@nestjs/common'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { PrismaService } from 'src/prisma/prisma.service'
import { CreateAuctionDto } from './dto/create-auction.dto'
import { UpdateAuctionDto } from './dto/update-auction.dto'
import { AuctionTimes } from './types'

@Injectable()
export class AuctionService {
    constructor(private prismaService: PrismaService) {}

    async create(createAuctionDto: CreateAuctionDto) {
        const nextAuctionDate = this.getAuctionTimes()

        const auction = await this.prismaService.auction
            .create({
                data: {
                    title: createAuctionDto.title,
                    description: createAuctionDto.description,
                    startDate: nextAuctionDate.nextMondayNoon,
                    endDate: nextAuctionDate.nextWednesdayNoon,
                },
            })
            .catch((error) => {
                if (error instanceof PrismaClientKnownRequestError) {
                    if (error.code === 'P2002') {
                        throw new ForbiddenException('Auction already exists.')
                    }
                }
                throw error
            })

        return auction
    }

    async findAll() {
        return await this.prismaService.auction.findMany().catch((error) => {
            throw error
        })
    }

    async findOne(id: string) {
        return await this.prismaService.auction
            .findFirst({
                where: {
                    id,
                },
            })
            .catch((error) => {
                throw error
            })
    }

    async update(id: string, dto: UpdateAuctionDto) {
        await this.prismaService.auction.updateMany({
            where: {
                id,
            },
            data: {
                title: dto.title,
                description: dto.description,
            },
        })

        return true
    }

    async remove(id: string) {
        const deletedAuction = await this.prismaService.auction
            .delete({
                where: {
                    id,
                },
            })
            .catch((error) => {
                if (error instanceof PrismaClientKnownRequestError) {
                    if (error.code === 'P2025') {
                        throw new ForbiddenException('Auction not found')
                    }
                } else {
                    throw new ForbiddenException(
                        'Unknown error occurred while deleting auction',
                    )
                }
                throw error
            })

        return deletedAuction
    }

    getAuctionTimes(): AuctionTimes {
        const timeZone = 'America/Denver' // MST timezone
        let now = moment.tz(timeZone)

        // Calculate next Monday noon in MST
        let nextMondayNoon: moment.Moment
        if (now.day() === 1 && now.hour() < 12) {
            // If today is Monday and it's before noon in MST
            nextMondayNoon = now.clone().hour(12).minute(0).second(0)
        } else {
            // Otherwise, find the next Monday in MST
            nextMondayNoon = now
                .clone()
                .startOf('isoWeek')
                .add(1, 'week')
                .hour(12)
                .minute(0)
                .second(0)
        }

        // Calculate the following Wednesday noon in MST
        let nextWednesdayNoon: moment.Moment = nextMondayNoon
            .clone()
            .add(2, 'days')
            .hour(12)
            .minute(0)
            .second(0)

        return {
            nextMondayNoon: nextMondayNoon.format(),
            nextWednesdayNoon: nextWednesdayNoon.format(),
        }
    }
}

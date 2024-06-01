import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name)

    constructor(private prismaService: PrismaService) {}

    @Cron('0 12 * * 3', { timeZone: 'America/Denver' })
    handleCron() {
        this.logger.debug('find highest bid as winner')
        this.markHighestBidsAsWinners()
        this.logger.debug('change auction status')
        this.updateAuctionStatus()
    }

    async updateAuctionStatus() {
        await this.prismaService.auction.updateMany({
            where: {
                status: 'Ongoing',
            },
            data: {
                status: 'Ended',
            },
        })
    }

    async markHighestBidsAsWinners() {
        // Retrieve all ongoing auctions
        const auctions = await this.prismaService.auction.findMany({
            where: {
                status: 'Ongoing',
            },
            include: {
                products: {
                    include: {
                        bids: true,
                    },
                },
            },
        })

        // Iterate through each auction
        for (const auction of auctions) {
            // Iterate through each product in the auction
            for (const product of auction.products) {
                // Find the highest bid for the product
                const highestBid = product.bids.reduce(
                    (max, bid) => (bid.amount > max.amount ? bid : max),
                    product.bids[0],
                )

                if (highestBid) {
                    // Mark the highest bid as the winner
                    await this.prismaService.bid.update({
                        where: {
                            id: highestBid.id,
                        },
                        data: {
                            isWinner: true,
                        },
                    })
                }
            }
        }
    }
}

import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { AtGuard } from './common/guards'
import { ProductModule } from './product/product.module'

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        AuthModule,
        ProductModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: AtGuard,
        },
    ],
})
export class AppModule {}

import { Body, Controller, HttpCode, HttpStatus, Patch } from '@nestjs/common'
import { UserService } from './user.service'
import { GetCurrentUserId } from 'src/common/decorators'
import { UserUpdateDto } from './dto'

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Patch('update')
    @HttpCode(HttpStatus.OK)
    updateUser(
        @GetCurrentUserId() userId: string,
        @Body() dto: UserUpdateDto,
    ): Promise<boolean> {
        return this.userService.updateUser(userId, dto)
    }
}

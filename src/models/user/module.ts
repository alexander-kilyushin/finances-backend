import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"

import { UserController } from "./controller"
import { UserEntity } from "./entities/user.entity"
import { UserService } from "./service"

@Module({
  exports: [UserService],
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [UserController, UserService],
  controllers: [UserController],
})
export class UserModule {}
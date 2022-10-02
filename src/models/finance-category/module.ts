import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"

import { FinanceCategoryTypeModule } from "#models/finance-category-type/module"
import { GroupsModule } from "#models/groups/module"

import { FinanceCategoryController } from "./controller"
import { FinanceCategoryEntity } from "./entities/finance-category.entity"
import { FinanceCategoryService } from "./service"

@Module({
  exports: [FinanceCategoryService],
  imports: [TypeOrmModule.forFeature([FinanceCategoryEntity]), FinanceCategoryTypeModule, GroupsModule],
  providers: [FinanceCategoryController, FinanceCategoryService],
  controllers: [FinanceCategoryController],
})
export class FinanceCategoryModule {}

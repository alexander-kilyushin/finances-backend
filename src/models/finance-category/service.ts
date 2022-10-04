import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { In, Repository } from "typeorm"

import { BoardsService } from "#models/boards/service"
import { FinanceCategoryTypeService } from "#models/finance-category-type/service"
import { UserEntity } from "#models/user/entities/user.entity"

import { CreateFinanceCategoryDto } from "./dto/create-finance-category.dto"
import { SearchFinanceCategoriesQueryDto } from "./dto/seach-finance-categories-query.dto"
import { UpdateFinanceCategoryDto } from "./dto/update-finance-category.dto"
import { FinanceCategoryEntity } from "./entities/finance-category.entity"

@Injectable()
export class FinanceCategoryService {
  constructor(
    @InjectRepository(FinanceCategoryEntity)
    private financeCategoryRepository: Repository<FinanceCategoryEntity>,
    private financeCategoryTypeService: FinanceCategoryTypeService,
    private boardsService: BoardsService
  ) {}

  async searchCategories({
    authorizedUser,
    query,
  }: {
    authorizedUser: UserEntity
    query: SearchFinanceCategoriesQueryDto
  }): Promise<FinanceCategoryEntity[]> {
    const accessibleBoardsIds = [
      ...new Set([
        ...authorizedUser.administratedBoards.map((board) => board.id),
        ...authorizedUser.boards.map((board) => board.id),
      ]),
    ]
    const boardsIdsToSearchWith =
      query.boardId === undefined
        ? accessibleBoardsIds
        : query.boardId
            .split(",")
            .map(parseInt)
            .filter((boardIdFromQuery) => accessibleBoardsIds.includes(boardIdFromQuery))

    return this.financeCategoryRepository.find({
      order: { id: "ASC", name: "ASC" },
      relations: { board: true, type: true },
      where: {
        ...(query.boardId !== undefined && { board: In(query.boardId.split(",")) }),
        ...(query.id !== undefined && { id: In(query.id.split(",")) }),
        board: { id: In(boardsIdsToSearchWith) },
      },
    })
  }

  async findById({
    authorizedUser,
    categoryId,
  }: {
    authorizedUser: UserEntity
    categoryId: FinanceCategoryEntity["id"]
  }): Promise<FinanceCategoryEntity> {
    const category = await this.financeCategoryRepository.findOne({
      relations: { board: true, type: true },
      where: { id: categoryId },
    })
    if (category === null) throw new NotFoundException({})

    const isAuthorizedUserBoardAdmin = authorizedUser.administratedBoards.some((board) => {
      return board.id === category.board.id
    })
    const isAuthorizedUserBoardMember = authorizedUser.boards.some((board) => board.id === category.board.id)
    const canAuthorizedUserEditThisCategory = isAuthorizedUserBoardAdmin || isAuthorizedUserBoardMember
    if (!canAuthorizedUserEditThisCategory) {
      throw new ForbiddenException({ message: "Access denied." })
    }

    return category
  }

  async create({
    authorizedUser,
    createFinanceCategoryDto,
  }: {
    authorizedUser: UserEntity
    createFinanceCategoryDto: CreateFinanceCategoryDto
  }): Promise<FinanceCategoryEntity> {
    if (createFinanceCategoryDto.name === undefined || createFinanceCategoryDto.name === "")
      throw new BadRequestException({ fields: { name: "Required field." } })
    if (createFinanceCategoryDto.typeId === undefined) {
      throw new BadRequestException({ fields: { typeId: "Required field." } })
    }
    if (createFinanceCategoryDto.boardId === undefined) {
      throw new BadRequestException({ fields: { boardId: "Required field." } })
    }
    const type = await this.financeCategoryTypeService
      .find({ financeCategoryTypeId: createFinanceCategoryDto.typeId })
      .catch(() => {
        throw new BadRequestException({ fields: { typeId: "Invalid category type." } })
      })
    const board = await this.boardsService.find({ boardId: createFinanceCategoryDto.boardId }).catch(() => {
      throw new BadRequestException({ fields: { boardId: "Invalid board." } })
    })
    const theSameExistingCategory = await this.financeCategoryRepository.findOne({
      relations: { board: true, type: true },
      where: { board, name: createFinanceCategoryDto.name, type },
    })
    if (theSameExistingCategory !== null) {
      throw new BadRequestException({
        fields: {
          boardId: `"${theSameExistingCategory.name}" ${theSameExistingCategory.type.name} category already exists in this board.`,
          name: `"${theSameExistingCategory.name}" ${theSameExistingCategory.type.name} category already exists in this board.`,
          typeId: `"${theSameExistingCategory.name}" ${theSameExistingCategory.type.name} category already exists in this board.`,
        },
      })
    }
    const category = this.financeCategoryRepository.create({ board, name: createFinanceCategoryDto.name, type })
    const createdCategory = await this.financeCategoryRepository.save(category)
    return await this.findById({ authorizedUser, categoryId: createdCategory.id })
  }

  async update({
    authorizedUser,
    categoryId,
    updateFinanceCategoryDto,
  }: {
    authorizedUser: UserEntity
    categoryId: FinanceCategoryEntity["id"]
    updateFinanceCategoryDto: UpdateFinanceCategoryDto
  }): Promise<FinanceCategoryEntity> {
    const category = await this.findById({ authorizedUser, categoryId })

    const isAuthorizedUserBoardAdmin = authorizedUser.administratedBoards.some((board) => {
      return board.id === category.board.id
    })
    const isAuthorizedUserBoardMember = authorizedUser.boards.some((board) => board.id === category.board.id)
    const canAuthorizedUserEditThisCategory = isAuthorizedUserBoardAdmin || isAuthorizedUserBoardMember
    if (!canAuthorizedUserEditThisCategory) {
      throw new ForbiddenException({ message: "Access denied." })
    }

    if (
      updateFinanceCategoryDto.boardId === undefined &&
      updateFinanceCategoryDto.name === undefined &&
      updateFinanceCategoryDto.typeId === undefined
    ) {
      return category
    }
    if (updateFinanceCategoryDto.typeId !== undefined) {
      try {
        category.type = await this.financeCategoryTypeService.find({
          financeCategoryTypeId: updateFinanceCategoryDto.typeId,
        })
      } catch {
        throw new BadRequestException({ fields: { typeId: "Invalid category type." } })
      }
    }
    if (updateFinanceCategoryDto.boardId !== undefined) {
      try {
        category.board = await this.boardsService.find({ boardId: updateFinanceCategoryDto.boardId })
      } catch {
        throw new BadRequestException({ fields: { boardId: "Invalid board." } })
      }
    }
    if (updateFinanceCategoryDto.name !== undefined) {
      if (updateFinanceCategoryDto.name === "") {
        throw new BadRequestException({ fields: { name: "Category name cannot be empty." } })
      }
      category.name = updateFinanceCategoryDto.name
    }
    const theSameExistingCategory = await this.financeCategoryRepository.findOne({
      relations: { board: true, type: true },
      where: { board: category.board, name: category.name, type: category.type },
    })
    if (theSameExistingCategory !== null) {
      throw new BadRequestException({
        fields: {
          boardId: `"${theSameExistingCategory.name}" ${theSameExistingCategory.type.name} category already exists in this board.`,
          name: `"${theSameExistingCategory.name}" ${theSameExistingCategory.type.name} category already exists in this board.`,
          typeId: `"${theSameExistingCategory.name}" ${theSameExistingCategory.type.name} category already exists in this board.`,
        },
      })
    }
    await this.financeCategoryRepository.save(category)
    return await this.findById({ authorizedUser, categoryId })
  }

  async delete({
    authorizedUser,
    categoryId,
  }: {
    authorizedUser: UserEntity
    categoryId: FinanceCategoryEntity["id"]
  }): Promise<FinanceCategoryEntity> {
    const category = await this.findById({ authorizedUser, categoryId })
    await this.financeCategoryRepository.delete(categoryId)
    return category
  }
}

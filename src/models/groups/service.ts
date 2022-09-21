import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { In, Like, Repository } from "typeorm"

import { GroupsSubjectsEntity } from "#models/groups-subjects/entities/groups-subjects.entity"
import { GroupsSubjectsService } from "#models/groups-subjects/service"
import { UserService } from "#models/user/service"

import { IUser } from "#interfaces/user"

import { CreateGroupDto } from "./dto/create-group.dto"
import { SearchGroupsQueryDto } from "./dto/search-groups-query.dto"
import { UpdateGroupDto } from "./dto/update-finance-category.dto"
import { GroupEntity } from "./entities/group.entity"

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(GroupEntity)
    private groupsRepository: Repository<GroupEntity>,
    private groupsSubjectsService: GroupsSubjectsService,
    private userService: UserService
  ) {}

  search(query: SearchGroupsQueryDto): Promise<GroupEntity[]> {
    return this.groupsRepository.find({
      relations: { subject: true, users: true },
      where: {
        ...(query.id !== undefined && { id: In(query.id.split(",")) }),
        ...(query.subjectId !== undefined && { id: In(query.subjectId.split(",")) }),
        ...(query.name !== undefined && { name: Like(`%${query.name}%`) }),
      },
    })
  }

  async findById(id: GroupEntity["id"]): Promise<GroupEntity> {
    const group = await this.groupsRepository.findOne({
      relations: { subject: true, users: true },
      where: { id },
    })
    if (group === null) throw new NotFoundException({})
    return group
  }

  async create({
    authorizedUserId,
    createGroupDto,
  }: {
    authorizedUserId: IUser["id"]
    createGroupDto: CreateGroupDto
  }): Promise<GroupEntity> {
    if (createGroupDto.name === undefined || createGroupDto.name === "") {
      throw new BadRequestException({ fields: { name: "Required field." } })
    }
    if (createGroupDto.subjectId === undefined) {
      throw new BadRequestException({ fields: { subjectId: "Required field." } })
    }
    let subject: GroupsSubjectsEntity | undefined
    try {
      subject = await this.groupsSubjectsService.findById(createGroupDto.subjectId)
    } catch {
      throw new BadRequestException({ fields: { subjectId: "Invalid subject." } })
    }
    const theSameExistingGroup = await this.groupsRepository.findOne({
      relations: { subject: true },
      where: { name: createGroupDto.name, subject },
    })
    if (theSameExistingGroup !== null) {
      throw new BadRequestException({
        fields: {
          name: `"${theSameExistingGroup.name}" ${theSameExistingGroup.subject.name} group already exists.`,
          subjectId: `"${theSameExistingGroup.name}" ${theSameExistingGroup.subject.name} group already exists.`,
        },
      })
    }
    const authorizedUser = await this.userService.findUser({ id: authorizedUserId })
    const group = this.groupsRepository.create({ name: createGroupDto.name, subject, users: [authorizedUser] })
    return this.groupsRepository.save(group)
  }

  async update({
    authorizedUserId,
    groupId,
    updateGroupDto,
  }: {
    authorizedUserId: IUser["id"]
    groupId: GroupEntity["id"]
    updateGroupDto: UpdateGroupDto
  }): Promise<GroupEntity> {
    const group = await this.findById(groupId)
    if (updateGroupDto.name !== undefined) {
      if (updateGroupDto.name === "") {
        throw new BadRequestException({ fields: { name: "Name cannot be empty." } })
      }
      group.name = updateGroupDto.name
    }
    if (updateGroupDto.subjectId !== undefined) {
      try {
        group.subject = await this.groupsSubjectsService.findById(updateGroupDto.subjectId)
      } catch {
        throw new BadRequestException({ fields: { subjectId: "Invalid group subject." } })
      }
    }
    const theSameExistingGroup = await this.groupsRepository.findOne({
      relations: { subject: true },
      where: { name: group.name, subject: group.subject },
    })
    if (theSameExistingGroup !== null) {
      throw new BadRequestException({
        fields: {
          name: `"${theSameExistingGroup.name}" ${theSameExistingGroup.subject.name} group already exists.`,
          subjectId: `"${theSameExistingGroup.name}" ${theSameExistingGroup.subject.name} group already exists.`,
        },
      })
    }
    return this.groupsRepository.save(group)
  }

  async delete({
    authorizedUserId,
    groupId,
  }: {
    authorizedUserId: IUser["id"]
    groupId: GroupEntity["id"]
  }): Promise<GroupEntity> {
    const group = await this.findById(groupId)
    await this.groupsRepository.delete(groupId)
    return group
  }
}
import { InputType, Field, Int } from '@nestjs/graphql'

@InputType()
export class UpdateFinanceCategoryTypeDto {
	@Field(type => Int)
	id: number

	@Field({ nullable: true })
	name?: string
}
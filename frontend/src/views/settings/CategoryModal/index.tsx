import { SubmitHandler, useForm } from 'react-hook-form'
import Button from '@mui/material/Button'

import { useAppDispatch } from '#utils/hooks'
import { createCategoryTc, updateCategoryTc } from '#models/finance'
import { Modal } from '#components/Modal'
import { ModalHeader } from '#components/Modal/ModalHeader'
import { ModalBody } from '#components/Modal/ModalBody'
import { ModalButtonsContainer } from '#components/Modal/ModalButtonsContainer'
import { Form } from '#components/form-constructor/Form'
import { FormRow } from '#components/form-constructor/FormRow'
import { PlainInput } from '#components/form-constructor/PlainInput'
import { RadioGroup } from '#components/form-constructor/RadioGroup'
import { IFinanceCategory, IFinanceCategoryType } from '#interfaces/finance'

export const CategoryModal = ({ category, categoryTypes, closeModal }: IProps) => {
  const dispatch = useAppDispatch()

  const defaultValues = category
    ? { name: category.name, typeId: String(category.type.id) }
    : { name: '', typeId: undefined }

  const { handleSubmit, register } = useForm<IFormValues>({ defaultValues })

  const submitCategoryForm: SubmitHandler<IFormValues> = ({ name, typeId }) => {
    if (category) {
      dispatch(updateCategoryTc({ categoryId: category.id, name, typeId: Number(typeId) }))
    } else {
      dispatch(createCategoryTc({ name, typeId: Number(typeId) }))
    }

    closeModal()
  }

  return (
    <Modal closeModal={closeModal}>
      <ModalHeader>
        <h4>{!!category ? 'Edit category' : 'Create category'}</h4>
      </ModalHeader>

      <ModalBody>
        <Form onSubmit={handleSubmit(submitCategoryForm)}>
          <FormRow label="Name" name="name">
            <PlainInput {...register('name', { required: true })} />
          </FormRow>
          <FormRow label="Type" name="typeId">
            <RadioGroup
              isRequired
              name="typeId"
              options={categoryTypes.map(({ id, name }) => ({ id, label: name }))}
              register={register}
            />
          </FormRow>

          <ModalButtonsContainer>
            <Button onClick={closeModal}>Cancel</Button>
            <Button type="submit">Submit</Button>
          </ModalButtonsContainer>
        </Form>
      </ModalBody>
    </Modal>
  )
}

interface IProps {
  category: IFinanceCategory | null
  categoryTypes: IFinanceCategoryType[]
  closeModal: () => void
}

interface IFormValues {
  name: IFinanceCategory['name']
  typeId: string
}

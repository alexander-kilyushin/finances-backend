// gql
import { getFinanceRecordsQuery } from '#gql/get-finance-records.query'

// components
import { Header } from '#components/by-page/finance/records-table/header'
import { Row } from '#components/by-page/finance/records-table/row'

// styles
import s from '#components/by-page/finance/records-table/index.module.css'

export default function Trash() {
	const { data } = getFinanceRecordsQuery({
		variables: {
			isTrashed: true,
			orderingByDate: 'DESC',
			orderingById: 'DESC',
		},
	})

	return (
		<div className={s.Table}>
			<Header isTrash />

			<div className={s.Body}>
				{data?.financeRecords.map(record => (
					<Row key={record.id} record={record} />
				))}
			</div>
		</div>
	)
}
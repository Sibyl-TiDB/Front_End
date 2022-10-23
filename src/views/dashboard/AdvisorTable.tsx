import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  IColumn
} from '@fluentui/react/lib/DetailsList'
import useFetch from 'use-http'

import './AdvisorTable.css'
import { SQL_ADVISOR_URL } from '../../api'

const columns: IColumn[] = [
  {
    key: 'SqlTxt',
    fieldName: 'SqlTxt',
    name: 'SQL',
    minWidth: 160,
    onRender: (item) => {
      return (
        <Link to={`sql-advisor/${item.Digest}`} target={'_blank'}>
          {item.SqlTxt}
        </Link>
      )
    }
  },
  {
    key: 'Impact',
    fieldName: 'Impact',
    name: 'Impact',
    minWidth: 80
  }
]

export const AdvisorTable: React.FC<{ range: [number, number] }> = ({
  range
}) => {
  const [advices, setAdvices] = useState<any>([])
  const { get } = useFetch(SQL_ADVISOR_URL)
  const getAdvices = async () => {
    const resp = await get(`QueryTunningResults?t=${range[0]}`)
    const rst = resp.tuningResults

    rst.sort((a: any, b: any) => {
      if (parseInt(a.Impact) > parseInt(b.Impact)) {
        return -1
      } else {
        return 1
      }
    })

    setAdvices(rst)
  }

  useEffect(() => {
    getAdvices()
  }, [range])

  return (
    <DetailsList
      items={advices}
      columns={columns}
      selectionMode={SelectionMode.none}
      setKey='none'
      layoutMode={DetailsListLayoutMode.justified}
      isHeaderVisible={true}
      className='advisor-table -mt-6'
    />
  )
}

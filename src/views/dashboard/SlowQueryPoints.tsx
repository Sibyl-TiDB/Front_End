import { Position, TooltipType } from '@elastic/charts'
import { MetricsChart, MetricsQueryResponse } from 'metrics-chart'
import React, { useRef, useState } from 'react'
import useFetch from 'use-http'
import { Dropdown } from '@fluentui/react'

import { Card } from '../../components/Card'
import { DASHBOARD_URL, SQL_ADVISOR_URL } from '../../api'

const slowQueryTypeOptions = [
  { key: 'all', text: 'All' },
  { key: 'tikv', text: 'TP' },
  { key: 'tiflash', text: 'AP' }
]

export const SlowQueryPointsCard: React.FC<{
  range: [number, number]
  updateRange: () => void
  className?: string
  onLoaded?: (slowQueryResp: any) => void
}> = ({ range, updateRange, className, onLoaded }) => {
  const [slowQueryType, _setSlowQueryType] = useState<
    'all' | 'tikv' | 'tiflash'
  >('all')
  const setSlowQueryType = (value: 'all' | 'tikv' | 'tiflash') => {
    _setSlowQueryType(value)
    updateRange()
  }
  const [groupBy, _setGroupBy] = useState('QueryText')
  const setGroupBy = (s: string) => {
    _setGroupBy(s)
    updateRange()
  }
  const { get } = useFetch(SQL_ADVISOR_URL)
  const listMapRef = useRef<any>({})
  const getSlowQueryPoints = async (): Promise<MetricsQueryResponse> => {
    const resp = await get(`topSlowQuerySummary?t=${range[0]}`)
    onLoaded?.(resp)
    const data =
      slowQueryType === 'all'
        ? [...resp.tidbSlowQueryList, ...resp.tiflashSlowQueryList]
        : slowQueryType === 'tikv'
        ? resp.tidbSlowQueryList
        : resp.tiflashSlowQueryList
    const { list, listMap } = dataTransform(data, groupBy)
    listMapRef.current = listMap
    return {
      data: {
        result: list,
        resultType: 'matrix'
      },
      status: 'success'
    }
  }

  // const [exRange, setExRange] = useState(range)
  return (
    <Card
      className={className}
      expandModalContent={
        <>
          <p className='card-title'>TP/AP Slow Query Latency</p>
          <Dropdown
            className='absolute top-5 left-60'
            placeholder='Select an option'
            defaultSelectedKey={slowQueryType}
            options={slowQueryTypeOptions}
            onChanged={(op) => {
              setSlowQueryType(op.key as any)
            }}
          />
          <div className='absolute top-5 left-[310px] flex'>
            <span className='mr-2 mt-1'>Group By:</span>
            <Dropdown
              placeholder='Select an option'
              styles={{
                dropdown: { width: 120 }
              }}
              defaultSelectedKey={groupBy}
              options={[
                {
                  key: 'QueryText',
                  text: 'SQL Text'
                },
                {
                  key: 'Digest',
                  text: 'Digest'
                },
                {
                  key: 'DB',
                  text: 'DB'
                },
                {
                  key: 'TiDBInstance',
                  text: 'TiDB Instance'
                }
              ]}
              onChanged={(op) => {
                setGroupBy(op.key as any)
              }}
            />
          </div>
          <MetricsChart
            height={800}
            queries={[
              {
                promql: '',
                name: '{name}',
                type: 'point'
              }
            ]}
            unit='s'
            range={range}
            chartSetting={{
              legendSize: 300,
              legendPosition: Position.Bottom,
              tooltip: {
                type: TooltipType.Follow
              }
            }}
            fetchPromeData={() => getSlowQueryPoints()}
            // onBrush={(newRange) => setExRange(newRange)}
            onElementClick={(e) => {
              const sqlTxt = (e[0] as any)[1]?.specId
              const execTime = (e[0] as any)[0]?.x / 1000
              const slowQuery = listMapRef.current[`${execTime}_${sqlTxt}`]
              window.open(
                `${DASHBOARD_URL}/#/slow_query/detail?query=%7B"digest"%3A"${slowQuery.Digest}"%2C"connectId"%3A"${slowQuery.Connection}"%2C"timestamp"%3A${slowQuery.TimeAt}%7D`,
                '_blank'
              )
            }}
          />
        </>
      }
    >
      <p className='card-title'>TP/AP Slow Query Latency</p>
      <Dropdown
        className='absolute top-5 left-60'
        placeholder='Select an option'
        defaultSelectedKey={slowQueryType}
        options={slowQueryTypeOptions}
        onChanged={(op) => {
          setSlowQueryType(op.key as any)
        }}
      />
      <div className='absolute top-5 left-[310px] flex'>
        <span className='mr-2 mt-1'>Group By:</span>
        <Dropdown
          placeholder='Select an option'
          styles={{
            dropdown: { width: 120 }
          }}
          defaultSelectedKey={groupBy}
          options={[
            {
              key: 'QueryText',
              text: 'SQL Text'
            },
            {
              key: 'Digest',
              text: 'Digest'
            },
            {
              key: 'DB',
              text: 'DB'
            },
            {
              key: 'TiDBInstance',
              text: 'TiDB Instance'
            }
          ]}
          onChanged={(op) => {
            setGroupBy(op.key as any)
          }}
        />
      </div>

      <MetricsChart
        height={170}
        queries={[
          {
            promql: '',
            name: '{name}',
            type: 'point'
          }
        ]}
        unit='s'
        range={range}
        chartSetting={{
          legendSize: 200,
          tooltip: {
            type: TooltipType.Follow
          }
        }}
        fetchPromeData={() => getSlowQueryPoints()}
      />
    </Card>
  )
}

export const dataTransform = (list: any[], legendKey: string) => {
  const listMap = list.reduce((prev, cur) => {
    prev[`${cur.ExeTime}_${cur.QueryText}`] = cur
    return prev
  }, {} as any)
  const listObj = list.reduce((prev, cur) => {
    if (prev[cur[legendKey]]) {
      prev[cur[legendKey]].values.push([cur.ExeTime, cur.Time])
    } else {
      prev[cur[legendKey]] = {
        metric: { name: cur[legendKey] },
        values: [[cur.ExeTime, cur.Time]]
      }
    }
    return prev
  }, {} as { [k: string]: { metric: { name: string }; values: [number, number][] } })
  return {
    listMap,
    list: Object.values(listObj).map((item: any) => {
      item.values.sort((a: any, b: any) => a[0] - b[0])
      return item
    })
  }
}

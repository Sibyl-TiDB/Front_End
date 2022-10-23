import { getValueFormat } from '@baurine/grafana-value-formats'
import { Position, TooltipType } from '@elastic/charts'
import {
  Dropdown,
  MessageBar,
  MessageBarType,
  TooltipHost
} from '@fluentui/react'
import {
  MetricsChart,
  SyncChartPointer,
  TransformNullValue
} from 'metrics-chart'
import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import useFetch from 'use-http'
import { DASHBOARD_URL, SQL_ADVISOR_URL, useDashboardFetch } from '../../../api'

import { Card } from '../../../components/Card'
import { ADVICES } from '../../../i18n'
import { get1HourRange } from '../../dashboard'
import { dataTransform } from '../../dashboard/SlowQueryPoints'

import './index.css'

export const SQLAdvisorDetail = () => {
  const { id } = useParams()
  const { get } = useFetch(SQL_ADVISOR_URL)
  const { get: getDashboard } = useDashboardFetch()
  const [range, setRange] = useState<[number, number]>(get1HourRange())
  const [detail, setDetail] = useState<any>(null)
  const [tables, setTables] = useState<string[]>([])

  const getDetail = async () => {
    const detail = await get(`GetTunningDetail?digest=${id}`)
    setDetail(detail.tuningResults)
    if (detail.tuningResults.Advisors?.length) {
      setTables(detail.tuningResults.Advisors.map((a: any) => a.TableName))
    }
  }

  const [slowQueryCount, setSlowQueryCount] = useState(0)
  const listMapRef = useRef<any>({})
  const getDetailSlowQuery = async () => {
    const resp = await get(`GetSlowQueriesByDigest?digest=${id}`)
    setSlowQueryCount(resp.tidbSlowQueryList.length)
    const { list, listMap } = dataTransform(resp.tidbSlowQueryList, 'QueryText')
    listMapRef.current = listMap
    return {
      data: {
        result: list,
        resultType: 'matrix'
      },
      status: 'success'
    }
  }

  const [execCount, setExecCount] = useState(0)
  const [duration, setDuration] = useState(0)
  const [memory, setMemory] = useState(0)
  const [indexes, setIndexes] = useState([])
  const getDashboardStmt = async () => {
    const resp = await getDashboard(
      `statements/plans?begin_time=${range[0] - 30 * 60}&end_time=${
        range[1]
      }&digest=${id}`
    )
    setExecCount(
      resp
        .map((d: any) => d.exec_count)
        .reduce((prev: number, cur: number) => prev + cur, 0)
    )
    setDuration(
      resp
        .map((d: any) => d.avg_latency)
        .reduce((prev: number, cur: number) => prev + cur, 0)
    )
    setMemory(
      resp
        .map((d: any) => d.avg_mem)
        .reduce((prev: number, cur: number) => prev + cur, 0)
    )
    setIndexes(resp.map((d: any) => d.index_names))
  }

  useEffect(() => {
    getDetail()
    getDashboardStmt()
  }, [])

  // const [exRange, setExRange] = useState(range)
  return (
    <SyncChartPointer>
      <div className='sql-advisor-detail'>
        <div className='app-container'>
          <p className='text-center text-4xl mb-6'>SQL Advisor Detail</p>

          {detail && (
            <>
              <div className='card-container'>
                <Card className='w-full mx-2 z-[5]'>
                  <div className='mb-6'>
                    <div className='inline-block float-right'>
                      <MessageBar messageBarType={MessageBarType.warning}>
                        Impact: <b>{detail.Impact}</b>
                      </MessageBar>
                    </div>
                    <TooltipHost content={detail.SqlTxt}>
                      <p className='text-[#ccc] cursor-pointer text-2xl mb-2 overflow-hidden whitespace-nowrap w-4/6 text-ellipsis'>
                        {detail.SqlTxt}
                      </p>
                    </TooltipHost>
                    <p>{detail.Digest}</p>
                  </div>
                  <div>
                    {detail.Advisors?.[0] && (
                      <>
                        {detail.Advisors?.[0].AdviszedStmt && (
                          <MessageBar messageBarType={MessageBarType.success}>
                            <p className='text-[#ccc] mb-2 text-base'>
                              {ADVICES[detail.Advisors?.[0].Suggestion]}
                            </p>
                            <p>{detail.Advisors?.[0].AdviszedStmt}</p>
                          </MessageBar>
                        )}
                      </>
                    )}
                  </div>
                </Card>
              </div>

              <div className='mx-2 my-4 w-40'>
                <Dropdown
                  placeholder='Select an option'
                  label='Time Range'
                  defaultSelectedKey={'last_1h'}
                  options={[{ key: 'last_1h', text: 'Last One Hour' }]}
                />
              </div>

              <div className='card-container'>
                <Card className='w-1/5 mx-2 h-[140px] z-[6]'>
                  <p className='text-lg mb-4'>Execution Count</p>
                  <p className='text-[#ccc] text-4xl'>{execCount}</p>
                </Card>
                <div className='w-4/5 mx-2 h-[140px] z-[5] flex'>
                  <Card className='w-1/4 mr-2 h-[140px] z-[5]'>
                    <p className='text-lg mb-4'>Avg. Exec Duration</p>
                    <p className='text-[#ccc] text-4xl'>
                      {getValueFormat('ns')(duration, 2)}
                    </p>
                  </Card>
                  <Card className='w-1/4 mx-2 h-[140px] z-[4]'>
                    <p className='text-lg mb-4'>Avg. Memory</p>
                    <p className='text-[#ccc] text-4xl'>
                      {getValueFormat('bytes')(memory, 2)}
                    </p>
                  </Card>
                  <Card className='w-1/4 mx-2 h-[140px] z-[3]'>
                    <p className='text-lg mb-4'>Table Used</p>
                    <div className='max-h-14 overflow-auto text-[#ccc]'>
                      {tables.map((t) => (
                        <p>{t}</p>
                      ))}
                    </div>
                  </Card>
                  <Card className='w-1/4 ml-2 h-[140px] z-[2]'>
                    <p className='text-lg mb-4'>Index Used</p>
                    <div className='max-h-14 overflow-auto text-[#ccc]'>
                      {indexes.map((t) => (
                        <p>{t}</p>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>

              <div className='card-container'>
                <Card className='w-1/5 mx-2 h-[280px] z-[8]'>
                  <p className='text-lg mb-4'>Slow Queries Count</p>
                  <p className='text-[#ccc] text-4xl'>{slowQueryCount}</p>
                </Card>
                <Card
                  className='w-4/5 mx-2 h-[280px] z-[7]'
                  expandModalContent={
                    <>
                      <p className='text-lg mb-4'>Slow Queries Latency</p>
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
                        chartSetting={{
                          showLegend: false,
                          legendSize: 300,
                          legendPosition: Position.Bottom,
                          tooltip: {
                            type: TooltipType.Follow
                          }
                        }}
                        range={range}
                        fetchPromeData={getDetailSlowQuery}
                        // onBrush={(newRange) => setExRange(newRange)}
                        onElementClick={(e) => {
                          const sqlTxt = (e[0] as any)[1]?.specId
                          const execTime = (e[0] as any)[0]?.x / 1000
                          const slowQuery =
                            listMapRef.current[`${execTime}_${sqlTxt}`]
                          window.open(
                            `${DASHBOARD_URL}/#/slow_query/detail?query=%7B"digest"%3A"${slowQuery.Digest}"%2C"connectId"%3A"${slowQuery.Connection}"%2C"timestamp"%3A${slowQuery.TimeAt}%7D`,
                            '_blank'
                          )
                        }}
                      />
                    </>
                  }
                >
                  <p className='text-lg mb-4'>Slow Queries Latency</p>
                  <MetricsChart
                    height={200}
                    queries={[
                      {
                        promql: '',
                        name: '{name}',
                        type: 'point'
                      }
                    ]}
                    unit='s'
                    chartSetting={{
                      showLegend: false,
                      tooltip: {
                        type: TooltipType.Follow
                      }
                    }}
                    range={range}
                    fetchPromeData={getDetailSlowQuery}
                    // onBrush={(newRange) => setExRange(newRange)}
                    onElementClick={(e) => {
                      const sqlTxt = (e[0] as any)[1]?.specId
                      const execTime = (e[0] as any)[0]?.x / 1000
                      const slowQuery =
                        listMapRef.current[`${execTime}_${sqlTxt}`]
                      window.open(
                        `${DASHBOARD_URL}/#/slow_query/detail?query=%7B"digest"%3A"${slowQuery.Digest}"%2C"connectId"%3A"${slowQuery.Connection}"%2C"timestamp"%3A${slowQuery.TimeAt}%7D`,
                        '_blank'
                      )
                    }}
                  />
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </SyncChartPointer>
  )
}

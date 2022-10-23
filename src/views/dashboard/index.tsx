import React, { useEffect, useState } from 'react'
import {
  MetricsChart,
  MetricsQueryResponse,
  SyncChartPointer,
  TransformNullValue
} from 'metrics-chart'
import useFetch from 'use-http'

import '@elastic/charts/dist/theme_only_dark.css'
import './index.css'

import { AdvisorTable } from './AdvisorTable'
import { Card } from '../../components/Card'
import { FlipCard } from '../../components/FlipCard'

// import testData from './demo.json'
import { SlowQueryPointsCard } from './SlowQueryPoints'
import { useDashboardFetch } from '../../api'
import { getValueFormat } from '@baurine/grafana-value-formats'
import { Position } from '@elastic/charts'

// const { tidbSlowQueryList } = testData

// const d = {
//   data: {
//     result: dataTransform(tidbSlowQueryList),
//     resultType: 'matrix'
//   },
//   status: 'success'
// }

export const get1HourRange = (): [number, number] => {
  const now = Date.now()
  return [
    parseInt(`${(now - 60 * 60 * 1000) / 1000}`),
    parseInt(`${now / 1000}`)
  ]
}

const get1MinRange = (): [number, number] => {
  const now = Date.now()
  return [parseInt(`${(now - 60 * 1000) / 1000}`), parseInt(`${now / 1000}`)]
}

let autoRefreshTimer: any = 0

function App() {
  const [range, setRange] = useState<[number, number]>(get1HourRange())
  const { get } = useDashboardFetch()
  const queryMetrics = async (params: any) =>
    get(
      `metrics/query?end_time_sec=${params.endTimeSec}&query=${params.query}&start_time_sec=${params.startTimeSec}&step_sec=30`
    )
  const queryMetricsPoint = async (query: string) => {
    const r = get1MinRange()
    const res = await queryMetrics({
      startTimeSec: r[0],
      endTimeSec: r[1],
      query
    })
    const values = res.data.result[0]?.values
    const value = values ? values[values.length - 1][1] : 0
    return value === 'NaN' ? 0 : value
  }

  const [qps, setQPS] = useState<any>()
  const getQPS = async () => {
    const v = await queryMetricsPoint(
      'sum(rate(tidb_executor_statement_total[2m]))'
    )
    setQPS(v)
  }
  const [duration, setDuration] = useState<any>()
  const getDuration = async () => {
    const v = await queryMetricsPoint(
      'sum(rate(tidb_server_handle_query_duration_seconds_sum{sql_type!="internal"}[2m])) / sum(rate(tidb_server_handle_query_duration_seconds_count{sql_type!="internal"}[2m]))'
    )
    setDuration(v)
  }

  const [connection, setConeection] = useState<any>()
  const getConnection = async () => {
    const v = await queryMetricsPoint('sum(tidb_server_tokens)')
    setConeection(v)
  }
  const [netIn, setNetIn] = useState<any>()
  const getNetIn = async () => {
    const v = await queryMetricsPoint(
      'sum(rate(tidb_server_packet_io_bytes{k8s_cluster="", tidb_cluster="", instance=~".*", type="read"}[1m]))'
    )
    setNetIn(v)
  }
  const [netOut, setNetOut] = useState<any>()
  const getNetOut = async () => {
    const v = await queryMetricsPoint(
      'sum(rate(tidb_server_packet_io_bytes{k8s_cluster="", tidb_cluster="", instance=~".*", type="write"}[1m]))'
    )
    setNetOut(v)
  }

  const [tidbCPU, setTiDBCPU] = useState<any>()
  const getTiDBCPU = async () => {
    const v = await queryMetricsPoint(
      'avg(rate(process_cpu_seconds_total{job="tidb"}[1m]))'
    )
    setTiDBCPU(v)
  }
  const [tikvCPU, setTiKVCPU] = useState<any>()
  const getTiKVCPU = async () => {
    const v = await queryMetricsPoint(
      'avg(rate(process_cpu_seconds_total{job="tikv"}[1m]))'
    )
    setTiKVCPU(v)
  }
  const [tiflashCPU, setTiFlashCPU] = useState<any>()
  const getTiFlashCPU = async () => {
    const v = await queryMetricsPoint(
      'avg(rate(tiflash_proxy_process_cpu_seconds_total{job="tiflash"}[1m]))'
    )
    setTiFlashCPU(v)
  }

  const [tikvStorage, setTiKVStorage] = useState<any>()
  const getTiKVStorage = async () => {
    const v = await queryMetricsPoint(
      'sum(tikv_store_size_bytes{type="used"})/ sum(tikv_store_size_bytes{type="capacity"})'
    )
    setTiKVStorage(v)
  }
  const [tiflashStorage, setTiFlashStorage] = useState<any>()
  const getTiFlashStorage = async () => {
    const v = await queryMetricsPoint(
      'sum(tiflash_system_current_metric_StoreSizeUsed{k8s_cluster="", tidb_cluster="", instance=~".*"})/ sum(tiflash_system_current_metric_StoreSizeCapacity{k8s_cluster="", tidb_cluster="", instance=~".*"})'
    )
    setTiFlashStorage(v)
  }

  const queryPointMetrics = () => {
    getQPS()
    getDuration()

    getConnection()
    getNetIn()
    getNetOut()

    getTiDBCPU()
    getTiKVCPU()
    getTiFlashCPU()

    getTiKVStorage()
    getTiFlashStorage()
  }

  const autoRefresh = () => {
    clearTimeout(autoRefreshTimer)
    autoRefreshTimer = setTimeout(() => {
      setRange(get1HourRange())
      queryPointMetrics()
      autoRefresh()
    }, 60000)
  }

  useEffect(() => {
    autoRefresh()
    queryPointMetrics()
    return () => clearTimeout(autoRefreshTimer)
  }, [])

  const [slowQueryCount, setSlowQueryCount] = useState(0)

  return (
    <SyncChartPointer>
      <div className='App'>
        <div className='app-container'>
          <p className='text-center text-4xl mb-6'>HTAP Overview</p>

          <div className='card-container'>
            <FlipCard
              className='w-1/4 mx-2 h-[180px] z-[5]'
              front={
                <>
                  <p className='card-title'>Query Performance</p>
                  <div className='card-info'>
                    <p className='card-info-text'>
                      <span>QPS</span>
                      <span className='card-info-value'>
                        {qps && getValueFormat('qps')(qps, 2)}
                      </span>
                    </p>
                    <p className='card-info-text'>
                      <span>Query Duration</span>
                      <span className='card-info-value'>
                        {duration && getValueFormat('s')(duration, 4)}
                      </span>
                    </p>
                  </div>
                </>
              }
              back={
                <MetricsChart
                  height={160}
                  queries={[
                    {
                      promql: 'sum(rate(tidb_executor_statement_total[2m]))',
                      name: 'QPS',
                      type: 'line'
                    }
                  ]}
                  unit='qps'
                  subQueries={[
                    {
                      promql:
                        'sum(rate(tidb_server_handle_query_duration_seconds_sum{sql_type!="internal"}[2m])) / sum(rate(tidb_server_handle_query_duration_seconds_count{sql_type!="internal"}[2m]))',
                      name: 'Query Duration',
                      type: 'line'
                    }
                  ]}
                  subUnit='s'
                  chartSetting={{ showLegend: false }}
                  nullValue={TransformNullValue.AS_ZERO}
                  range={range}
                  fetchPromeData={queryMetrics}
                />
              }
            />
            <FlipCard
              className='w-1/4 mx-2 h-[180px] z-[4]'
              front={
                <>
                  <p className='card-title'>Connection Status</p>
                  <div className='card-info'>
                    <p className='card-info-text'>
                      <span>Active Connection</span>
                      <span className='card-info-value'>
                        {connection && getValueFormat('short')(connection, 2)}
                      </span>
                    </p>
                    <p className='card-info-text'>
                      <span>Network In</span>
                      <span className='card-info-value'>
                        {netIn && getValueFormat('Bps')(netIn, 2)}
                      </span>
                    </p>
                    <p className='card-info-text'>
                      <span>Network Out</span>
                      <span className='card-info-value'>
                        {netOut && getValueFormat('Bps')(netOut, 2)}
                      </span>
                    </p>
                  </div>
                </>
              }
              back={
                <MetricsChart
                  height={160}
                  queries={[
                    {
                      promql: 'sum(tidb_server_tokens)',
                      name: 'Active Connection',
                      type: 'line'
                    }
                  ]}
                  unit='short'
                  subQueries={[
                    {
                      promql:
                        'sum(rate(tidb_server_packet_io_bytes{k8s_cluster="", tidb_cluster="", instance=~".*", type="read"}[1m]))',
                      name: 'Network In',
                      type: 'line'
                    },
                    {
                      promql:
                        'sum(rate(tidb_server_packet_io_bytes{k8s_cluster="", tidb_cluster="", instance=~".*", type="write"}[1m]))',
                      name: 'Network Out',
                      type: 'line'
                    }
                  ]}
                  subUnit='Bps'
                  chartSetting={{ showLegend: false }}
                  nullValue={TransformNullValue.AS_ZERO}
                  range={range}
                  fetchPromeData={queryMetrics}
                />
              }
            />
            <FlipCard
              className='w-1/4 mx-2 h-[180px] z-[3]'
              front={
                <>
                  <p className='card-title'>CPU Status</p>
                  <div className='card-info'>
                    <p className='card-info-text'>
                      <span>Avg. TiDB CPU Usage</span>
                      <span className='card-info-value'>
                        {tidbCPU && getValueFormat('percentunit')(tidbCPU, 2)}
                      </span>
                    </p>
                    <p className='card-info-text'>
                      <span>Avg. TiKV CPU Usage</span>
                      <span className='card-info-value'>
                        {tikvCPU && getValueFormat('percentunit')(tikvCPU, 2)}
                      </span>
                    </p>
                    <p className='card-info-text'>
                      <span>Avg. TiFlash CPU Usage</span>
                      <span className='card-info-value'>
                        {tiflashCPU &&
                          getValueFormat('percentunit')(tiflashCPU, 2)}
                      </span>
                    </p>
                  </div>
                </>
              }
              back={
                <MetricsChart
                  height={160}
                  queries={[
                    {
                      promql:
                        'avg(rate(process_cpu_seconds_total{job="tidb"}[1m]))',
                      name: 'Avg. TiDB CPU Usage',
                      type: 'line'
                    },
                    {
                      promql:
                        'avg(rate(process_cpu_seconds_total{job="tikv"}[1m]))',
                      name: 'Avg. TiKV CPU Usage',
                      type: 'line'
                    },
                    {
                      promql:
                        'avg(rate(tiflash_proxy_process_cpu_seconds_total{job="tiflash"}[1m]))',
                      name: 'Avg. TiFlash CPU Usage',
                      type: 'line'
                    }
                  ]}
                  chartSetting={{ showLegend: false }}
                  unit='percentunit'
                  nullValue={TransformNullValue.AS_ZERO}
                  range={range}
                  fetchPromeData={queryMetrics}
                />
              }
            />
            <FlipCard
              className='w-1/4 mx-2 h-[180px] z-[2]'
              front={
                <>
                  <p className='card-title'>Storage Status</p>
                  <div className='card-info'>
                    <p className='card-info-text'>
                      <span>TP(TiKV) Disk UTIL</span>
                      <span className='card-info-value'>
                        {tikvStorage &&
                          getValueFormat('percentunit')(tikvStorage, 2)}
                      </span>
                    </p>
                    <p className='card-info-text'>
                      <span>AP(TiFlash) Disk UTIL</span>
                      <span className='card-info-value'>
                        {tiflashStorage &&
                          getValueFormat('percentunit')(tiflashStorage, 2)}
                      </span>
                    </p>
                  </div>
                </>
              }
              back={
                <MetricsChart
                  height={160}
                  queries={[
                    {
                      promql:
                        'sum(tikv_store_size_bytes{type="used"})/ sum(tikv_store_size_bytes{type="capacity"})',
                      name: 'TiKV Disk Utilization',
                      type: 'line'
                    },
                    {
                      promql:
                        'sum(tiflash_system_current_metric_StoreSizeUsed{k8s_cluster="", tidb_cluster="", instance=~".*"})/ sum(tiflash_system_current_metric_StoreSizeCapacity{k8s_cluster="", tidb_cluster="", instance=~".*"})',
                      name: 'TiFlash Disk Utilization',
                      type: 'line'
                    }
                  ]}
                  chartSetting={{ showLegend: false }}
                  unit='percentunit'
                  nullValue={TransformNullValue.AS_ZERO}
                  range={range}
                  fetchPromeData={queryMetrics}
                />
              }
            />
          </div>

          <div className='card-container'>
            <Card
              className='w-1/2 mx-2 h-[280px] z-[5]'
              expandModalContent={
                <div className='flex'>
                  <div className='w-1/2'>
                    <p className='card-title'>TP Read OPS</p>
                    <MetricsChart
                      height={800}
                      queries={[
                        {
                          promql:
                            'sum(rate(tikv_grpc_msg_duration_seconds_count{type=~"coprocessor|kv_batch_get|kv_get|kv_pessimistic_lock|kv_scan_lock|kv_txn_heart_beat"}[1m]))',
                          name: 'TP Read OPS',
                          type: 'line'
                        },
                        {
                          promql:
                            'sum(rate(tikv_grpc_msg_duration_seconds_count{type=~"coprocessor|kv_batch_get|kv_get|kv_pessimistic_lock|kv_scan_lock|kv_txn_heart_beat"}[1m])) by (type)',
                          name: '{type}',
                          type: 'bar_stacked'
                        }
                      ]}
                      chartSetting={{
                        legendSize: 300,
                        legendPosition: Position.Bottom
                      }}
                      unit='ops'
                      nullValue={TransformNullValue.AS_ZERO}
                      range={range}
                      fetchPromeData={queryMetrics}
                    />
                  </div>
                  <div className='w-1/2'>
                    <p className='card-title'>TP Write OPS</p>
                    <MetricsChart
                      height={800}
                      queries={[
                        {
                          promql:
                            'sum(rate(tikv_grpc_msg_duration_seconds_count{type=~"kv_check_txn_status|kv_commit|kv_prewrite|kv_resolve_lock"}[1m]))',
                          name: 'TP Write OPS',
                          type: 'line'
                        },
                        {
                          promql:
                            'sum(rate(tikv_grpc_msg_duration_seconds_count{type=~"kv_check_txn_status|kv_commit|kv_prewrite|kv_resolve_lock"}[1m])) by (type)',
                          name: '{type}',
                          type: 'bar_stacked'
                        }
                      ]}
                      chartSetting={{
                        legendSize: 300,
                        legendPosition: Position.Bottom
                      }}
                      unit='ops'
                      nullValue={TransformNullValue.AS_ZERO}
                      range={range}
                      fetchPromeData={queryMetrics}
                    />
                  </div>
                </div>
              }
            >
              <p className='card-title'>TP Node(TiKV) Operations</p>
              <MetricsChart
                height={200}
                queries={[
                  {
                    promql:
                      'sum(rate(tikv_grpc_msg_duration_seconds_count{type=~"coprocessor|kv_batch_get|kv_get|kv_pessimistic_lock|kv_scan_lock|kv_txn_heart_beat"}[1m]))',
                    name: 'TP Read OPS',
                    type: 'line'
                  },
                  {
                    promql:
                      'sum(rate(tikv_grpc_msg_duration_seconds_count{type=~"kv_check_txn_status|kv_commit|kv_prewrite|kv_resolve_lock"}[1m]))',
                    name: 'TP Write OPS',
                    type: 'line'
                  }
                ]}
                unit='ops'
                nullValue={TransformNullValue.AS_ZERO}
                range={range}
                fetchPromeData={queryMetrics}
              />
            </Card>

            <Card
              className='w-1/2 mx-2 h-[280px] z-[4]'
              expandModalContent={
                <>
                  <p className='card-title'>AP Node(TiFlash) Operations</p>
                  <div className='flex'>
                    <div className='w-1/2'>
                      <MetricsChart
                        height={800}
                        queries={[
                          {
                            promql:
                              'sum(rate(tiflash_coprocessor_request_count{k8s_cluster="", tidb_cluster="", instance=~".*"}[1m]))',
                            name: 'AP Read OPS',
                            type: 'line'
                          },
                          {
                            promql:
                              'sum(rate(tiflash_coprocessor_request_count{k8s_cluster="", tidb_cluster="", instance=~".*"}[1m])) by (type)',
                            name: '{type}',
                            type: 'bar_stacked'
                          }
                        ]}
                        unit='ops'
                        nullValue={TransformNullValue.AS_ZERO}
                        range={range}
                        chartSetting={{
                          legendSize: 300,
                          legendPosition: Position.Bottom
                        }}
                        fetchPromeData={queryMetrics}
                      />
                    </div>
                    <div className='w-1/2'>
                      <MetricsChart
                        height={800}
                        queries={[
                          {
                            promql:
                              'sum(rate(tiflash_coprocessor_request_duration_seconds_sum[2m])) / sum(rate(tiflash_coprocessor_request_duration_seconds_count[2m]))',
                            name: 'AP Read OPS Duration',
                            type: 'line'
                          }
                        ]}
                        unit='s'
                        nullValue={TransformNullValue.AS_ZERO}
                        range={range}
                        chartSetting={{
                          legendSize: 300,
                          legendPosition: Position.Bottom
                        }}
                        fetchPromeData={queryMetrics}
                      />
                    </div>
                  </div>
                </>
              }
            >
              <p className='card-title'>AP Node(TiFlash) Operations</p>
              <MetricsChart
                height={200}
                queries={[
                  {
                    promql:
                      'sum(rate(tiflash_coprocessor_request_count{k8s_cluster="", tidb_cluster="", instance=~".*"}[1m]))',
                    name: 'AP Read OPS',
                    type: 'line'
                  }
                ]}
                unit='ops'
                subQueries={[
                  {
                    promql:
                      'sum(rate(tiflash_coprocessor_request_duration_seconds_sum[2m])) / sum(rate(tiflash_coprocessor_request_duration_seconds_count[2m]))',
                    name: 'AP Read OPS Duration',
                    type: 'line'
                  }
                ]}
                subUnit='s'
                nullValue={TransformNullValue.AS_ZERO}
                range={range}
                fetchPromeData={queryMetrics}
              />
            </Card>
          </div>

          <div className='card-container'>
            <SlowQueryPointsCard
              className='w-1/2 mx-2 h-[280px] z-[8]'
              range={range}
              updateRange={() => setRange(get1HourRange())}
              onLoaded={(resp) =>
                setSlowQueryCount(
                  [...resp.tidbSlowQueryList, ...resp.tiflashSlowQueryList]
                    .length
                )
              }
            />
            <div className='w-1/2 mx-2 flex'>
              <Card className='w-1/2 mr-2 h-[280px] z-[7]'>
                <p className='card-title'>Slow Query Count</p>
                <p className='text-[#ccc] text-4xl'>{slowQueryCount}</p>
              </Card>
              <Card className='w-1/2 ml-2 h-[280px] z-[6]'>
                <p className='card-title'>SQL Advisors</p>
                <AdvisorTable range={range} />
              </Card>
            </div>
          </div>
        </div>
      </div>
    </SyncChartPointer>
  )
}

export default App

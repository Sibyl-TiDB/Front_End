import React from 'react'
import ReactDOM from 'react-dom'
import { initializeIcons } from '@fluentui/font-icons-mdl2'
import { ThemeProvider } from '@fluentui/react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import './index.css'
import Dashboard from './views/dashboard'
import { SQLAdvisorDetail } from './views/sql_advisor/detail'
import { DarkTheme } from './theme'
import { useLogin } from './api'

initializeIcons()

const router = createBrowserRouter([
  { path: '/', element: <Dashboard /> },
  { path: '/sql-advisor/:id', element: <SQLAdvisorDetail /> }
])

const App = () => {
  useLogin()

  return (
    <ThemeProvider theme={DarkTheme}>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
)

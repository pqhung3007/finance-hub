import './App.css'
import { Routes, Route, Navigate } from 'react-router'
import { RootLayout } from './layouts/root'
import { HomePage } from './pages/home'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<Navigate to="/search" />} />
          <Route path="/search" element={<HomePage />} />
        </Route>
      </Routes>

      <ReactQueryDevtools />
    </QueryClientProvider>
  )
}

export default App

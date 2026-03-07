import Storefront from '@/pages/Storefront'
import { Loader2 } from 'lucide-react'
import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

// Rule: bundle-dynamic-imports — lazy load heavy routes
const BackOffice = lazy(() => import('@/pages/BackOffice'))

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <Loader2 className="size-8 text-blue-500 animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Storefront />} />
      <Route 
        path="/admin" 
        element={
          <Suspense fallback={<LoadingScreen />}>
            <BackOffice />
          </Suspense>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}


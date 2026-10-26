import React, { useState } from 'react'
import LandingPage      from './pages/LandingPage'
import SelfAssessment   from './pages/SelfAssessment'
import MRIUpload        from './pages/MRIUpload'
import AssessmentResult from './pages/AssessmentResult'
import MRIResult        from './pages/MRIResult'

export default function App() {
  const [page,   setPage]   = useState('landing')
  const [result, setResult] = useState(null)
  const [mriRes, setMriRes] = useState(null)

  if (page === 'landing')
    return (
      <LandingPage
        onAssess={() => setPage('assess')}
        onMRI={()    => setPage('mri')}
      />
    )

  if (page === 'assess')
    return (
      <SelfAssessment
        onBack={()  => setPage('landing')}
        onDone={(r) => { setResult(r); setPage('result') }}
      />
    )

  if (page === 'mri')
    return (
      <MRIUpload
        onBack={()  => setPage('landing')}
        onDone={(r) => { setMriRes(r); setPage('mriresult') }}
      />
    )

  if (page === 'result')
    return (
      <AssessmentResult
        data={result}
        onMRI={()  => setPage('mri')}
        onHome={()  => setPage('landing')}
      />
    )

  if (page === 'mriresult')
    return (
      <MRIResult
        data={mriRes}
        onHome={()          => setPage('landing')}
        onUploadAnother={()  => setPage('mri')}
      />
    )

  return null
}

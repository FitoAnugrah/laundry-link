import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from './axios'
import Login from './Pages/Login'
import POSCreate from './Pages/POSCreate'
import OrderManagement from './Pages/OrderManagement'
import ServicesIndex from './Pages/Services/Index'
import CustomersIndex from './Pages/Customers/Index'
import ReportsIndex from './Pages/Reports/Index'
import Receipt from './Pages/Receipt'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/user')
       .then(res => setUser(res.data))
       .catch(() => setUser(null))
       .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />} />
      <Route path="/" element={user ? <POSCreate user={user} setUser={setUser} /> : <Navigate to="/login" />} />
      <Route path="/orders" element={user ? <OrderManagement user={user} setUser={setUser} /> : <Navigate to="/login" />} />
      <Route path="/services" element={user ? <ServicesIndex user={user} setUser={setUser} /> : <Navigate to="/login" />} />
      <Route path="/customers" element={user ? <CustomersIndex user={user} setUser={setUser} /> : <Navigate to="/login" />} />
      <Route path="/reports" element={user ? <ReportsIndex user={user} setUser={setUser} /> : <Navigate to="/login" />} />
      <Route path="/receipt/:id" element={user ? <Receipt /> : <Navigate to="/login" />} />
    </Routes>
  )
}

export default App

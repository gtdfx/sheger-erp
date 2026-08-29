import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Construction from './pages/Construction'
import Finance from './pages/Finance'
import Sales from './pages/Sales'
import Documents from './pages/Documents'
import Contacts from './pages/Contacts'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('sheger_token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="construction" element={<Construction />} />
          <Route path="finance" element={<Finance />} />
          <Route path="sales" element={<Sales />} />
          <Route path="documents" element={<Documents />} />
          <Route path="contacts" element={<Contacts />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

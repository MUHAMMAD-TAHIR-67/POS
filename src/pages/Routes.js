import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthContext } from 'contexts/AuthContext'
// import Frontend from './Frontend'
import Auth from './Auth'
import Dashboard from './Dashboard'
import PrivateRoute from 'components/PrivateRoute'

export default function Index() {
    const { isAuthenticated } = useAuthContext()
    return (
        <Routes>
            <Route path='/*' element={<Navigate to="/auth/login" />} />
            <Route path='auth/*' element={!isAuthenticated ? <Auth /> : <Navigate to="/dashboard" />} />
            <Route path='dashboard/*' element={<PrivateRoute Component={Dashboard} allowedRoles={["superAdmin", "admin"]} />} />
        </Routes>
    )
}

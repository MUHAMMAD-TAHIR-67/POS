import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Login from './Login'
import Register from './Register'
import ForgotPassword from './ForgotPassword'

export default function Auth() {
    return (
        <Routes>
            <Route path='login' element={<Login />} />
            <Route path='Register' element={<Register />} />
            <Route path='forgot-password' element={<ForgotPassword />} />
        </Routes>
    )
}

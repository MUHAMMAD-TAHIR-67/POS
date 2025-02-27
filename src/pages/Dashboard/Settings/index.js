import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Profile from './Profile'

export default function Settings() {
    return (
        <Routes>
            <Route path='profile' element={<Profile />} />
        </Routes>
    )
}

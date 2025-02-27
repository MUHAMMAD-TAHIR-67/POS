import React from 'react'
import { Route, Routes } from 'react-router-dom'
import AddClient from './AddClient'
import AllClient from './AllClient'
import EditClient from './EditClient'

export default function Clients() {
    return (
        <Routes>
            <Route path='addclient' element={<AddClient />} />
            <Route path='allclient' element={<AllClient />} />
            <Route path='editclient/:id' element={<EditClient />} />
        </Routes>
    )
}

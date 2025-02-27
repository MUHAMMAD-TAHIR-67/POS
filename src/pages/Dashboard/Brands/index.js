import React from 'react'
import { Route, Routes } from 'react-router-dom'
import EditBrand from './EditBrand'
import AllBrand from './AllBrand'
import AddBrand from './AddBrand'

export default function Bills() {
    return (
        <Routes>
            <Route path='addbrand' element={<AddBrand />} />
            <Route path='allbrand' element={<AllBrand />} />
            <Route path='editbrand/:id' element={<EditBrand />} />
        </Routes>
    )
}


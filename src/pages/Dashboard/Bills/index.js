import React from 'react'
import { Route, Routes } from 'react-router-dom'
import AddBill from './AddBill'
import AllBill from './AllBill'
import EditBill from './EditBill'
import ShowBill from './Showbill'
import Add from './AddBill copy'
export default function Bills() {
    return (
        <Routes>
            <Route path='addbill' element={<AddBill />} />
            <Route path='allbill' element={<AllBill />} />
            <Route path='editbill/:id' element={<EditBill />} />
            <Route path="/dashboard/bills/show/:id" element={<ShowBill/>} />
             <Route path='/dashboard/bills/safi' element={<Add/>} ></Route>
        </Routes>
    )
}


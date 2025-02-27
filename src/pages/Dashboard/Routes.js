import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Home from './Home';
import Bills from './Bills';
import Settings from './Settings';
import AddClient from './Clients/AddClient';
import AllClient from './Clients/AllClient';
import EditClient from './Clients/EditClient';
import AddBill from './Bills/AddBill';
import AllBill from './Bills/AllBill';
import EditBill from './Bills/EditBill';
import Clients from './Clients';
import AddBrand from './Brands/AddBrand';
import AllBrand from './Brands/AllBrand';
import Showbill from './Bills/Showbill';
import Add from './Bills/AddBill copy';


export default function Index() {
    return (
        <Routes>
            <Route index element={<Home />} />
            <Route path='bills' element={<Bills />} />
            <Route path='clients' element={<Clients />} />
            <Route path='clients/add' element={<AddClient />} />
            <Route path='clients/all' element={<AllClient />} />
            <Route path='clients/edit/:id' element={<EditClient/>}></Route>
            <Route path='bills/add' element={<AddBill/>}></Route>
            <Route path='bills/all' element={<AllBill/>}></Route>
            <Route path='bills/edit/:id' element={<EditBill/>}></Route>
            <Route path='bills/show/:id' element={<Showbill/>}></Route>
           <Route path='bills/safi' element={<Add/>}></Route>
            <Route path='brand/add' element={<AddBrand/>}></Route>
            <Route path='brand/all' element={<AllBrand/>}></Route>
            

            <Route path="settings/*" element={<Settings />} />
        </Routes>
    );
}
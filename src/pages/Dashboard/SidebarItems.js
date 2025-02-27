import { HomeOutlined, TeamOutlined, UserOutlined, SettingOutlined, SecurityScanOutlined, UnorderedListOutlined, PlusOutlined, FileDoneOutlined, ProductOutlined, UserAddOutlined, AppstoreAddOutlined, FileAddOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

export const items = [
    { key: "home", icon: <HomeOutlined />, label: <Link to="/dashboard">Home</Link> },
    {
        key: "clients", icon: <UserOutlined />, label: "Clients",
        children: [
            { key: "client-add", icon: <UserAddOutlined  />, label: <Link to="/dashboard/clients/add">Add Clients</Link> },
            { key: "clients-all", icon: <UnorderedListOutlined />, label: <Link to="/dashboard/clients/all">All Clients</Link> },
        ]
    },
    {
        key: "bills", icon: <FileDoneOutlined />, label: "Bills",
        children: [
            { key: "bills-add", icon: <FileAddOutlined />, label: <Link to="/dashboard/bills/add">Add Bills</Link> },
            { key: "bills-safi", icon: <FileAddOutlined />, label: <Link to="/dashboard/bills/safi">Add safi Bills</Link> },


            { key: "bills-all", icon: <UnorderedListOutlined />, label: <Link to="/dashboard/bills/all">All Bils</Link> },

            

        ]
    },
    {
        key: "brand", icon: <ProductOutlined />, label: "Brand",
        children: [
            { key: "brand-add", icon:<AppstoreAddOutlined />, label: <Link to="/dashboard/brand/add">Add Brands</Link> },
            { key: "brand-all", icon: <UnorderedListOutlined />, label: <Link to="/dashboard/brand/all">All Brands</Link> },
       
        ]
    },
   
];

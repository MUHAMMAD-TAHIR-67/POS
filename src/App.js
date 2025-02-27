import React from "react"
import { useAuthContext } from "contexts/AuthContext";
import Routes from "./pages/Routes"
import ScreenLoader from "components/ScreenLoader";
import './App.scss';
import "bootstrap/dist/js/bootstrap.bundle";
import { ConfigProvider } from "antd";

import Add from "pages/Dashboard/Bills/AddBill copy";
import Barcode from "pages/Dashboard/Brands/barcode";
import QRCodeGenerator from "pages/Dashboard/Brands/barcode";




function App() {
  const { isAppLoading } = useAuthContext()
  return (
    <>
    
    <ConfigProvider theme={{ token: { colorPrimary: "#1d3557", boxShadow: "none" } }}>
    {!isAppLoading
    ? <Routes />
    : <ScreenLoader />
    }
    </ConfigProvider>
{/* <QRCodeGenerator/> */}

    </>
  );
}

export default App;

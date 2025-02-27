import React from 'react'
import { Button } from 'antd'
import { useAuthContext } from 'contexts/AuthContext'

export default function NoPermission() {
    const { handleLogout } = useAuthContext()
    return (
        <>
            <h1>You don't have permission to access this page</h1>
            <Button type='primary' danger onClick={handleLogout}>Logout</Button>
        </>
    )
}

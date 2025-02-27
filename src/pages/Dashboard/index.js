import React, { useState } from 'react'
import Routes from "./Routes"
import { Layout, Menu } from 'antd';
import { items } from './SidebarItems';

const { Content, Sider } = Layout;

export default function Dashboard() {

    const [collapsed, setCollapsed] = useState(false);

    return (
        <Layout>
            <Sider breakpoint='lg' collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
                <div className="demo-logo-vertical" />
                <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline" items={items} />
            </Sider>
            <Layout>
                <Content className='p-3'>
                    <Routes />
                </Content>
            </Layout>
        </Layout>
    )
}

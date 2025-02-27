import React, { useState, useEffect, useCallback } from 'react';
import { Typography, List, Card, Button, Row, Col, Spin, message } from 'antd';
import { DollarOutlined, UserOutlined, LineChartOutlined, BarChartOutlined } from '@ant-design/icons';
import { useAuthContext } from "../../../contexts/AuthContext";
import { collection, getDocs, query } from 'firebase/firestore';
import { firestore } from '../../../config/firebase';


const { Title } = Typography;

const Home = () => {
    const { user, handleLogout } = useAuthContext();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch user data from Firestore
    const readUsers = useCallback(async () => {
        try {
            const q = query(collection(firestore, "users"));
            const querySnapshot = await getDocs(q);
            const array = querySnapshot.docs.map(doc => doc.data());
            setDocuments(array);
            setError(null);
        } catch (err) {
            setError('Failed to fetch user data');
            message.error('Error loading users');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        readUsers();
    }, [readUsers]);

    // Data for dashboard cards
    const cardData = [
        {
            title: "Today's Money",
            amount: Math.random().toFixed(5).slice(2),
            growth: "+55%",
            icon: <DollarOutlined style={{ fontSize: '24px', color: 'white' }} />,
            gradient: 'linear-gradient(to top right, #3b82f6, #2563eb)',
            growthColor: 'green',
        },
        {
            title: "Today's Users",
            amount: documents.length,
            growth: "+3%",
            icon: <UserOutlined style={{ fontSize: '24px', color: 'white' }} />,
            gradient: 'linear-gradient(to top right, #ec4899, #db2777)',
            growthColor: 'green',
        },
        {
            title: 'New Clients',
            amount: '3,462',
            growth: '-2%',
            icon: <LineChartOutlined style={{ fontSize: '24px', color: 'white' }} />,
            gradient: 'linear-gradient(to top right, #10b981, #047857)',
            growthColor: 'red',
        },
        {
            title: 'Sales',
            amount: '$103,430',
            growth: '+5%',
            icon: <BarChartOutlined style={{ fontSize: '24px', color: 'white' }} />,
            gradient: 'linear-gradient(to top right, #f97316, #ea580c)',
            growthColor: 'green',
        },
    ];

    return (
        <div className="container" style={{ padding: '20px' }}>
            <Title className='my-4' level={1} style={{ textAlign: 'center' }}>Welcome, {user?.email}</Title>
      

            <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                {cardData.map((data, index) => (
                    <Col xs={24} sm={12} lg={12} key={index}>
                        <Card
                            style={{ borderRadius: '16px', position: 'relative' }}
                            bodyStyle={{ padding: '16px', textAlign: 'right' }}
                            bordered={false}
                        >
                            <div
                                style={{
                                    background: data.gradient,
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '50%',
                                    display: 'grid',
                                    placeItems: 'center',
                                    position: 'absolute',
                                    top: '-24px',
                                    left: '16px',
                                    boxShadow: '0px 4px 12px rgba(0,0,0,0.3)',
                                }}
                            >
                                {data.icon}
                            </div>
                            <p style={{ fontSize: '14px', color: '#94a3b8' }}>{data.title}</p>
                            <h4 style={{ fontSize: '24px', margin: 0 }}>{data.amount}</h4>
                            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                                <span style={{ color: data.growthColor === 'green' ? '#10b981' : '#ef4444' }}>
                                    <strong>{data.growth}</strong>
                                </span>
                                &nbsp;than last period
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            <hr style={{ marginTop: '40px' }} />


            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <Button type='primary' danger onClick={handleLogout}>Logout</Button>
            </div>
        </div>
    );
};

export default Home;

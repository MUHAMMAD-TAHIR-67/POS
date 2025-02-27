import React, { useState, useEffect, useCallback } from 'react';
import { Button, Form, Input, Typography, Modal, message, Space, Spin, Card, Row, Col, Divider, Table } from 'antd';
import { useParams } from 'react-router-dom';
import { firestore } from 'config/firebase';
import { doc, getDoc, updateDoc, addDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { EditOutlined, MoneyCollectOutlined, UserOutlined, EnvironmentOutlined, PhoneOutlined, DollarOutlined } from '@ant-design/icons';
import { addPaymentToLedger, updateClientBalance } from './clientLedger';  // Import ledger functions

const { Title, Text } = Typography;

const EditClient = () => {
    const { id } = useParams();
    const [client, setClient] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [previousBalance, setPreviousBalance] = useState(0);
    const [clientName, setClientName] = useState('');
    const [clientAddress, setClientAddress] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentNote, setPaymentNote] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [ledgerData, setLedgerData] = useState([]);
    const [isLedgerVisible, setIsLedgerVisible] = useState(false); // State to control showing ledger

    // Fetch client data from Firestore
    const fetchClientData = useCallback(async () => {
        setIsLoading(true);
        try {
            const clientDoc = await getDoc(doc(firestore, 'clients', id));
            if (clientDoc.exists()) {
                const data = clientDoc.data();
                setClient({ id: clientDoc.id, ...data });
                setPreviousBalance(data.previousBalance || 0);
                setClientName(data.clientName || '');
                setClientAddress(data.clientAddress || '');
                setClientPhone(data.clientPhone || '');
            } else {
                message.error("Client not found");
            }
        } catch (error) {
            console.error("Error fetching client data:", error);
            message.error("Error fetching client data");
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchClientData();
    }, [fetchClientData]);

    // Update client information in Firestore
    const handleUpdateClient = async () => {
        try {
            const updatedClientData = {
                clientName,
                clientAddress,
                clientPhone,
                previousBalance,
            };
            await updateDoc(doc(firestore, 'clients', id), updatedClientData);
            setIsModalVisible(false);
            message.success("Client updated successfully");
            fetchClientData();
        } catch (error) {
            console.error("Error updating client:", error);
            message.error("Error updating client");
        }
    };

    // Handle recording payment
    const handlePayment = async () => {
        const payment = parseFloat(paymentAmount);
        if (isNaN(payment) || payment <= 0) {
            return message.error("Please enter a valid payment amount");
        }
        if (previousBalance === 0) {
            return message.error("Cannot record payment. Previous balance is zero.");
        }
        if (payment > previousBalance) {
            return message.error("Payment amount cannot exceed the previous balance.");
        }

        try {
            const newBalance = await addPaymentToLedger(id, payment, previousBalance, paymentNote);
            await updateClientBalance(id, newBalance);  // Update the balance in the clients collection

            setPreviousBalance(newBalance);
            setPaymentAmount('');
            setPaymentNote('');
            message.success("Payment recorded successfully");
        } catch (error) {
            console.error("Error recording payment:", error);
            message.error("Error recording payment");
        }
    };

    // Function to fetch ledger data when the "Show Ledger" button is clicked
    const fetchLedgerData = useCallback(async () => {
        try {
            const ledgerQuery = query(
                collection(firestore, 'clientLedger'),
                orderBy('date', 'desc'),  
                limit(5)  
            );
            const querySnapshot = await getDocs(ledgerQuery);
            const ledgerEntries = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setLedgerData(ledgerEntries);
            setIsLedgerVisible(true); // Set ledger visible once data is fetched
        } catch (error) {
            console.error("Error fetching ledger data:", error);
            message.error("Error fetching ledger data");
        }
    }, []);

    if (isLoading) {
        return (
            <div style={{ textAlign: 'center', marginTop: '20%' }}>
                <Spin tip="Loading client data..." size="large" />
            </div>
        );
    }

    if (!client) {
        return <p style={{ textAlign: 'center', color: 'red' }}>Client not found</p>;
    }

    // Define columns for the ledger table
    const columns = [
        {
            title: 'Transaction Type',
            dataIndex: 'transaction_type',
            key: 'transaction_type',
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: amount => `RS ${amount.toFixed(2)}`,
        },
        {
            title: 'Previous Balance',
            dataIndex: 'previous_balance',
            key: 'previous_balance',
            render: balance => `RS ${balance.toFixed(2)}`,
        },
        {
            title: 'New Balance',
            dataIndex: 'new_balance',
            key: 'new_balance',
            render: balance => `RS ${balance.toFixed(2)}`,
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: date => new Date(date).toLocaleString(),
        },
        {
            title: 'Note',
            dataIndex: 'note',
            key: 'note',
        },
    ];

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: 'auto' }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: '20px' }}>
                Client Dashboard
            </Title>

            <Row gutter={[16, 16]}>
                <Col span={12}>
                    <Card title={<><UserOutlined /> Client Name</>} bordered>
                        <Text>{client.clientName}</Text>
                    </Card>
                </Col>
                <Col span={12}>
                    <Card title={<><EnvironmentOutlined /> Address</>} bordered>
                        <Text>{client.clientAddress}</Text>
                    </Card>
                </Col>
                <Col span={12}>
                    <Card title={<><PhoneOutlined /> Phone</>} bordered>
                        <Text>{client.clientPhone}</Text>
                    </Card>
                </Col>
                <Col span={12}>
                    <Card title={<><DollarOutlined /> Previous Balance</>} bordered>
                        <Text>RS {previousBalance}</Text>
                    </Card>
                </Col>
            </Row>

            <Divider />

            <Row gutter={[16, 16]} justify="center">
                <Col>
                    <Button 
                        type="primary" 
                        icon={<EditOutlined />} 
                        onClick={() => setIsModalVisible(true)}
                    >
                        Edit Client
                    </Button>
                </Col>
            </Row>

            <Row gutter={[16, 16]} justify="center">
                <Col>
                    <Button className='m-5'
                        type="primary" 
                        icon={<MoneyCollectOutlined />} 
                        onClick={fetchLedgerData}
                    >
                        Show Ledger
                    </Button>
                </Col>
            </Row>

            {isLedgerVisible && (
                <Table
                    columns={columns}
                    dataSource={ledgerData}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    bordered
                    title={() => "Client Ledger"}
                />
            )}

            <Row justify="center">
                <Col span={24} md={12}>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <Title level={4}><MoneyCollectOutlined /> Record Payment</Title>

                        <Form layout="vertical" style={{ width: '100%' }}>
                            {/* Payment Amount */}
                            <Form.Item
                                label="Payment Amount"
                                name="paymentAmount"
                                rules={[{ required: true, message: 'Please enter a payment amount!' }]}
                            >
                                <Input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    placeholder="Enter payment amount"
                                    prefix={<DollarOutlined />}
                                    style={{ padding: '10px', fontSize: '16px' }}
                                />
                            </Form.Item>

                            {/* Payment Note */}
                            <Form.Item label="Payment Note (Optional)" name="paymentNote">
                                <Input
                                    value={paymentNote}
                                    onChange={(e) => setPaymentNote(e.target.value)}
                                    placeholder="Enter a note for the payment"
                                    prefix={<EditOutlined />}
                                    style={{ padding: '10px', fontSize: '16px' }}
                                />
                            </Form.Item>

                            {/* Record Payment Button */}
                            <Form.Item>
                                <Button
                                    type="primary"
                                    icon={<MoneyCollectOutlined />}
                                    onClick={handlePayment}
                                    block
                                    size="large"
                                    style={{ fontSize: '16px' }}
                                >
                                    Record Payment
                                </Button>
                            </Form.Item>
                        </Form>
                    </Space>
                </Col>
            </Row>

            <Modal
                title="Edit Client"
                visible={isModalVisible}
                onOk={handleUpdateClient}
                onCancel={() => setIsModalVisible(false)}
                okText="Save"
                cancelText="Cancel"
            >
                <Form layout="vertical">
                    <Form.Item label="Client Name" required>
                        <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
                    </Form.Item>
                    <Form.Item label="Client Address" required>
                        <Input value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} />
                    </Form.Item>
                    <Form.Item label="Client Phone" required>
                        <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
                    </Form.Item>
                    <Form.Item label="Previous Balance">
                        <Input
                            type="number"
                            value={previousBalance}
                            onChange={(e) => setPreviousBalance(parseFloat(e.target.value) || 0)}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default EditClient;

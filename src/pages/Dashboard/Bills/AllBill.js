import React, { useState, useEffect, useCallback } from 'react';
import { Col, Input, Row, Space, Table, Typography, Button } from 'antd';
import { useAuthContext } from 'contexts/AuthContext';
import { collection, getDocs, deleteDoc, orderBy, limit, query, where, doc } from 'firebase/firestore';
import { firestore } from 'config/firebase';
import { Link } from 'react-router-dom';
import { debounce } from 'lodash'; // Add lodash for debouncing

const { Title } = Typography;

export default function AllBill() {
    const { user } = useAuthContext();
    const [documents, setDocuments] = useState([]);
    const [filteredDocuments, setFilteredDocuments] = useState([]);
    const [searchValue, setSearchValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Debounced search handler
    const handleSearch = debounce((value) => {
        setSearchValue(value);
    }, 300); // 300 ms debounce time

    const getDocuments = useCallback(async () => {
        if (user.uid) {
            setIsLoading(true);
            let q;
            let lowercasedValue = searchValue.toLowerCase(); // Declare this outside the if statement

            // If searchValue exists, fetch by invoice number or client name
            if (searchValue) {
                q = query(
                    collection(firestore, "bills"),
                    where("user_id", "==", user.uid),
                    orderBy("dateCreated", "desc")
                );
            } else {
                q = query(
                    collection(firestore, "bills"),
                    where("user_id", "==", user.uid),
                    orderBy("dateCreated", "desc"),
                    limit(10) // Limit the number of documents fetched
                );
            }

            const array = [];
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                const document = doc.data();
                const invoiceNumberMatch = document.invoiceNumber.toString().includes(searchValue);
                const clientNameMatch = document.clientName.toLowerCase().includes(lowercasedValue);

                // Include documents if they match the search criteria
                if (!searchValue || invoiceNumberMatch || clientNameMatch) {
                    array.push({ ...document, key: doc.id });
                }
            });

            setDocuments(array);
            setFilteredDocuments(array);
            setIsLoading(false);
        }
    }, [user.uid, searchValue]);

    useEffect(() => { getDocuments(); }, [getDocuments]);

    const handleDelete = async (bill) => {
        try {
            await deleteDoc(doc(firestore, "bills", bill.key));
            const filteredDocuments = documents.filter(item => item.key !== bill.key);
            setDocuments(filteredDocuments);
            setFilteredDocuments(filteredDocuments);
            window.toastify("Bill deleted successfully", "success");
        } catch (err) {
            window.toastify("Something went wrong while deleting the bill", "error");
            console.error(err);
        }
    };

    const columns = [
        { title: 'Invoice Number', dataIndex: 'invoiceNumber', key: 'invoiceNumber' },
        { title: 'Client Name', dataIndex: 'clientName', key: 'clientName' },
        { title: 'Subtotal', dataIndex: 'subtotal', key: 'subtotal' },
        {
            title: 'Action',
            dataIndex: 'action',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Link to={`/dashboard/bills/edit/${record.key}`}>Edit</Link>
                    <Link to={`/dashboard/bills/show/${record.key}`}>Show</Link>
                    <Button type="link" danger onClick={() => handleDelete(record)}>Delete</Button>
                </Space>
            ),
        },
    ];

    return (
        <div className='container p-0'>
            <Row>
                <Col xs={24} lg={12}>
                    <Title level={2}>All Bills</Title>
                </Col>
                <Col xs={24} lg={12}>
                    <Input 
                        size='large' 
                        type='search' 
                        placeholder='Search Bill' 
                        onChange={(e) => handleSearch(e.target.value)} // Use the debounced search handler
                    />
                </Col>
            </Row>
            <div className="card card-shadow p-3 p-md-4">
                <div className="table-responsive">
                    <Table 
                        columns={columns} 
                        dataSource={filteredDocuments} 
                        loading={isLoading} 
                    />
                </div>
            </div>
        </div>
    );
}

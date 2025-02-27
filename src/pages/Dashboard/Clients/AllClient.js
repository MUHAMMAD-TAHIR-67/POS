import React, { useState, useEffect, useCallback } from 'react';
import { Col, Input, Row, Space, Table, Typography, Button } from 'antd';
import { useAuthContext } from 'contexts/AuthContext';
import { deleteDoc, doc, query, collection, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { firestore } from 'config/firebase';
import { Link } from 'react-router-dom';
import { debounce } from 'lodash'; // Import debounce from lodash

const { Title } = Typography;

export default function AllClient() {
    const { user } = useAuthContext();
    const [documents, setDocuments] = useState([]);
    const [filteredDocuments, setFilteredDocuments] = useState([]);
    const [searchValue, setSearchValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Debounced search function
    const handleSearch = debounce((value) => {
        setSearchValue(value);
    }, 300); // 300 ms debounce time

    const getDocuments = useCallback(async () => {
        if (user.uid) {
            setIsLoading(true);
            let q;

            // Prepare the query based on the search value
            if (searchValue) {
                q = query(
                    collection(firestore, "clients"),
                    where("user_id", "==", user.uid),
                    orderBy("dateCreated", "desc")
                );
            } else {
                // Limit to the latest 10 clients if no search value
                q = query(
                    collection(firestore, "clients"),
                    where("user_id", "==", user.uid),
                    orderBy("dateCreated", "desc"),
                    limit(30) // Limit the number of documents fetched
                );
            }

            const array = [];
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                const document = doc.data();

                // Check if the client's name matches the search value
                if (!searchValue || 
                    document.clientName.toLowerCase().includes(searchValue.toLowerCase())
                ) {
                    array.push({ ...document, key: doc.id });
                }
            });

            setDocuments(array);
            setFilteredDocuments(array); // Set both documents and filtered documents
            setIsLoading(false);
        }
    }, [user.uid, searchValue]);

    useEffect(() => {
        getDocuments();
    }, [getDocuments]);

    const handleDelete = async (client) => {
        try {
            await deleteDoc(doc(firestore, "clients", client.key));
            const filteredDocuments = documents.filter(item => item.key !== client.key);
            setDocuments(filteredDocuments);
            setFilteredDocuments(filteredDocuments);
            window.toastify("Client deleted successfully", "success");
        } catch (err) {
            window.toastify("Something went wrong while deleting the client", "error");
            console.error(err);
        }
    };

    const columns = [
        { title: 'Client Name', dataIndex: 'clientName', key: 'clientName' },
        { title: 'Client Address', dataIndex: 'clientAddress', key: 'clientAddress' },
        { title: 'Client Phone', dataIndex: 'clientPhone', key: 'clientPhone' },
        {
            title: 'Action', dataIndex: 'action', key: 'action',
            render: (_, record) => (
                <Space>
                    <Link to={`/dashboard/clients/edit/${record.key}`}>Update</Link>
                    {/* <Button type="link" danger onClick={() => handleDelete(record)}>Delete</Button> */}
                </Space>
            ),
        },
    ];

    return (
        <div className='container p-0'>
            <Row>
                <Col xs={24} lg={12}>
                    <Title level={2}>All Clients</Title>
                </Col>
                <Col xs={24} lg={12}>
                    <Input 
                        size='large' 
                        type='search' 
                        placeholder='Search Client' 
                        onChange={(e) => handleSearch(e.target.value)} 
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

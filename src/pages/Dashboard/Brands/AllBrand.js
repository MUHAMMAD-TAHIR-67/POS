import React, { useEffect, useState } from 'react';
import { Typography, Table, Collapse, Modal, Input, Space } from 'antd';
import { collection, getDocs, doc, updateDoc, deleteDoc, orderBy, query } from 'firebase/firestore';
import { firestore } from 'config/firebase';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Panel } = Collapse;

const AllBrands = () => {
    const [brands, setBrands] = useState([]);
    const [editingBrand, setEditingBrand] = useState(null);
    const [editingVariation, setEditingVariation] = useState(null);
    const [newSize, setNewSize] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [newStock, setNewStock] = useState('');

    // Fetch brands from Firestore
    const fetchBrands = async () => {
        const brandQuery = query(collection(firestore,'brands'),orderBy('createdAt'))
        const brandCollection = await getDocs(brandQuery);
        const brandList = await Promise.all(
            brandCollection.docs.map(async (doc) => {
                const variationsQuery = query(collection(firestore,'brands',doc.id,'variations'), orderBy('createdAt'))
                const variationsSnapshot = await getDocs(variationsQuery);
                const variations = variationsSnapshot.docs.map(v => ({ id: v.id, ...v.data() }));
                return { id: doc.id, name: doc.data().name, variations };
            })
        );
        setBrands(brandList);
    };

    useEffect(() => {
        fetchBrands();
    }, []);

    // Handle editing a brand
    const handleEditBrand = async () => {
        if (editingBrand) {
            const brandRef = doc(firestore, 'brands', editingBrand.id);
            await updateDoc(brandRef, { name: editingBrand.name });
            fetchBrands();
            setEditingBrand(null);
        }
    };

    // Handle editing a variation
    const handleEditVariation = async () => {
        if (editingVariation) {
            const variationRef = doc(firestore, 'brands', editingVariation.brandId, 'variations', editingVariation.id);
            await updateDoc(variationRef, { size: newSize, price: parseFloat(newPrice), stock: parseInt(newStock) });
            fetchBrands();
            setEditingVariation(null);
            setNewSize('');
            setNewPrice('');
            setNewStock('');
        }
    };

    // Handle deleting a brand
    const handleDeleteBrand = async (brandId) => {
        await deleteDoc(doc(firestore, 'brands', brandId));
        fetchBrands();
    };

    // Handle deleting a variation
    const handleDeleteVariation = async (brandId, variationId) => {
        await deleteDoc(doc(firestore, 'brands', brandId, 'variations', variationId));
        fetchBrands();
    };

    // Function to reduce stock when a bill is created
    const reduceStock = async (variationId, quantity) => {
        const variationRef = doc(firestore, 'brands', editingVariation.brandId, 'variations', variationId);
        const variationSnapshot = await getDocs(variationRef);
        const currentStock = variationSnapshot.data().stock;

        if (currentStock >= quantity) {
            await updateDoc(variationRef, { stock: currentStock - quantity });
        } else {
            window.toastify("Not enough stock available", "error");
        }
    };

    return (
        <main className="ant-layout-content p-3">
            <div className="container">
                <Title level={2}>All Brands</Title>
                <div className="ant-table-wrapper">
                    <Collapse accordion>
                        {brands.map((brand) => (
                            <Panel 
                                header={brand.name} 
                                key={brand.id} 
                                extra={
                                    <Space>
                                        <EditOutlined 
                                            style={{ cursor: 'pointer', color: 'black' }} 
                                            onClick={() => setEditingBrand(brand)} 
                                        />
                                        <DeleteOutlined className='ml-3'
                                            style={{ cursor: 'pointer', color: 'black' }} 
                                            onClick={() => handleDeleteBrand(brand.id)} 
                                        />
                                    </Space>
                                }
                            >
                                <Table
                                    dataSource={brand.variations}
                                    pagination={false}
                                    rowKey={(record) => record.id}
                                    bordered
                                >
                                    <Table.Column title="Variations" dataIndex="size" key="variations" />
                                    <Table.Column title="Price" dataIndex="price" key="price" />
                                    <Table.Column title="Stock" dataIndex="stock" key="stock" />
                                    <Table.Column
                                        title="Actions"
                                        key="actions"
                                        render={(text, record) => (
                                            <Space>
                                                <EditOutlined 
                                                    style={{ cursor: 'pointer', color: 'black' }} 
                                                    onClick={() => {
                                                        setEditingVariation({ ...record, brandId: brand.id });
                                                        setNewSize(record.size);
                                                        setNewPrice(record.price);
                                                        setNewStock(record.stock); // Set stock for editing
                                                    }} 
                                                />
                                                <DeleteOutlined 
                                                    style={{ cursor: 'pointer', color: 'black' }} 
                                                    onClick={() => handleDeleteVariation(brand.id, record.id)} 
                                                />
                                            </Space>
                                        )}
                                    />
                                </Table>
                            </Panel>
                        ))}
                    </Collapse>
                </div>
            </div>

            {/* Modal for Editing Brand */}
            <Modal
                title="Edit Brand"
                visible={!!editingBrand}
                onCancel={() => setEditingBrand(null)}
                onOk={handleEditBrand}
            >
                <Input
                    value={editingBrand ? editingBrand.name : ''}
                    onChange={(e) => setEditingBrand({ ...editingBrand, name: e.target.value })}
                />
            </Modal>

            {/* Modal for Editing Variation */}
            <Modal
                title="Edit Variation"
                visible={!!editingVariation}
                onCancel={() => setEditingVariation(null)}
                onOk={handleEditVariation}
            >
               <b style={{marginBottom:"-2px"}}>Variation</b>
                <Input
                
                className='mb-3'
                aria-label='variation'
                    placeholder="Size"
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                />
                <b style={{marginBottom:"-2px"}}>Price</b>
                <Input className='mb-3'
                    placeholder="Price"
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                />
                <b style={{marginBottom:"-2px"}}>Stock</b>
                <Input 
            
                aria-label='stock'
                    placeholder="Stock"
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                />
            </Modal>
        </main>
    );
};

export default AllBrands;

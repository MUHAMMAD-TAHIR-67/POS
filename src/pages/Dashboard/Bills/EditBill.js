import React, { useState, useEffect, useCallback } from 'react';
import { Button, Col, Row, Typography, Select, Input, Table, Modal } from 'antd';
import { useAuthContext } from 'contexts/AuthContext';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, updateDoc, orderBy, query } from 'firebase/firestore';
import { firestore } from 'config/firebase';
import { useParams } from 'react-router-dom';

const { Title } = Typography;
const { Option } = Select;

export default function EditBill() {
    const { user } = useAuthContext();
    const { id } = useParams();
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [brands, setBrands] = useState([]);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [variations, setVariations] = useState([]);
    const [selectedVariation, setSelectedVariation] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [addedItems, setAddedItems] = useState([]);
    const [invoiceNumber, setInvoiceNumber] = useState(0);
    const [totalSum, setTotalSum] = useState(0);
    const [percentageAmount, setPercentageAmount] = useState(0);
    const [previousBalance, setPreviousBalance] = useState(0);
    const [previousBalanceAmount, setPreviousBalanceAmount] = useState(0);
    const [finalAmountDue, setFinalAmountDue] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [percentage, setPercentage] = useState(null);
    const [difference, setDifference] = useState(0);
    const [note, setNote] = useState(""); 

    const fetchClients = useCallback(async () => {
        if (user.uid) {
            const clientCollection = await getDocs(collection(firestore, "clients"));
            const clientList = clientCollection.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setClients(clientList);
            setFilteredClients(clientList);
        }
    }, [user.uid]);
  const fetchBrandsAndVariations = async () => {
        const brandQuery = query(collection(firestore, 'brands'), orderBy('createdAt'));
        const brandCollection = await getDocs(brandQuery);
      
        const brandList = await Promise.all(
          brandCollection.docs.map(async (doc) => {
            const variationsQuery = query(
              collection(firestore, 'brands', doc.id, 'variations'),
              orderBy('createdAt')
            );
            const variationsCollection = await getDocs(variationsQuery);
            const variationsList = variationsCollection.docs.map((vDoc) => ({
              id: vDoc.id,
              brandName: doc.data().name,
              ...vDoc.data(),
            }));
            return { id: doc.id, name: doc.data().name, variations: variationsList };
          })
        );
      
        setBrands(brandList);
      };

    const fetchBillData = async () => {
        const billDoc = await getDoc(doc(firestore, "bills", id));
        if (billDoc.exists()) {
            const billData = billDoc.data();
            setSelectedClient(billData.client_id);
            setAddedItems(billData.items);
            setInvoiceNumber(billData.invoiceNumber);
            setPreviousBalanceAmount(billData.previousBalanceAmount || 0);
            setPercentageAmount(billData.discountAmount || 0);
            setTotalSum(billData.items.reduce((acc, item) => acc + item.subtotal, 0)); 
            setFinalAmountDue(billData.totalAmountDue ); 
            setNote(billData.note)
        } else {
            console.error("No such bill!");
        }
    };
    

    useEffect(() => {
        fetchClients();
        fetchBrandsAndVariations();
        if (id) fetchBillData();
    }, [fetchClients,id,setDoc]);

    useEffect(() => {
        if (selectedClient) {
            const client = clients.find(c => c.id === selectedClient);
            if (client) {
                setPreviousBalance(client.previousBalance || 0);
            }
        }
    }, [selectedClient, clients]);

    const handleClientSelect = (clientId) => {
        const client = clients.find(c => c.id === clientId);
        setSelectedClient(clientId);
        setSelectedBrand(null);
        setVariations([]);
        setAddedItems([]); 
        setTotalSum(0);
        setPercentageAmount(0);
        setFinalAmountDue(0);
    };

    const handleBrandSelect = (brandId) => {
        const brand = brands.find(b => b.id === brandId);
        setSelectedBrand(brand);
        setVariations(brand.variations);
        setSelectedVariation(null);
    };

    const handleVariationChange = (variationId) => {
        const variation = variations.find(v => v.id === variationId);
        setSelectedVariation(variation);
    };

    const handleAddItem = () => {
        if (!selectedVariation || quantity <= 0) return;

        const newItem = {
            itemNumber: addedItems.length + 1,
            size: selectedVariation.size,
            quantity,
            price: selectedVariation.price,
            subtotal: selectedVariation.price * quantity,
        };

        setAddedItems((prev) => [...prev, newItem]);
        setSelectedVariation(null);
        setQuantity(1);
        calculateTotal();
    };

    const handleDeleteItem = (itemIndex) => {
        setAddedItems((prev) => prev.filter((_, index) => index !== itemIndex));
        calculateTotal();
    };

    const calculateTotal = () => {
        const total = addedItems.reduce((acc, item) => acc + item.subtotal, 0);
        setTotalSum(total);
        const finalAmount = total - percentageAmount + previousBalanceAmount;
        setFinalAmountDue(finalAmount);
        setDifference(finalAmount - total);
    };

    const handleCalculateTotal = () => {
        const total = addedItems.reduce((acc, item) => acc + item.subtotal, 0);
        Modal.confirm({
            title: 'Enter Percentage',
            content: (
                <Input
                    type="number"
                    placeholder="Enter percentage"
                    onChange={(e) => setPercentage(e.target.value)}
                />
            ),
            onOk: () => {
                const percentValue = parseFloat(percentage);
                const calculatedPercentageAmount = (total * percentValue) / 100;
                setPercentageAmount(calculatedPercentageAmount);
                calculateTotal();
                window.toastify(`Percentage Amount: RS ${calculatedPercentageAmount}`, "info");
            },
        });
    };

    const handleUpdateBill = async () => {
        if (!selectedClient) return window.toastify("Please select a client", "error");
        if (addedItems.length === 0) return window.toastify("Please add at least one item", "error");

        setIsProcessing(true);

        const totalAmount = totalSum - percentageAmount; 
        const newBalance = previousBalanceAmount 
        const discountAmount = percentageAmount
      
        const client = clients.find(c => c.id === selectedClient);
        const clientName = client ? client.clientName : '';
        const totalAmountDue = finalAmountDue
        const formData = {
            client_id: selectedClient,
            clientName: clientName, 
            invoiceNumber,
            items: addedItems,
            user_id: user.uid,
            previousBalanceAmount: newBalance, 
            discountAmount,  
            totalAmountDue,   
          
            dateUpdated: serverTimestamp(),
            dateCreated: serverTimestamp(),
            note, 
        };

        try {
            await updateDoc(doc(firestore, "bills", id), formData); 
            await updateDoc(doc(firestore, "clients", selectedClient), {
                previousBalanceAmount: newBalance, 
            }, { merge: true });

            window.toastify("Bill has been successfully updated", "success");

           
            setSelectedClient(null);
            setAddedItems([]);
            setVariations([]);
            setSelectedBrand(null);
            setTotalSum(0);
            setPercentageAmount(0);
            setFinalAmountDue(0);
            
        } catch (e) {
            window.toastify("Something went wrong", "error");
            console.error("Error updating document: ", e);
        } finally {
            setIsProcessing(false);
        }
    };

  

    const clientDetails = selectedClient ? clients.find(c => c.id === selectedClient) : null;

    return (
        <div>
            <Title level={2}>Edit Bill</Title>
            <div className="card card-shadow p-3 p-md-4">
                <Row>
                <Col><b>{note}</b></Col>
                </Row>
                <Row gutter={16}>
                  

                    {clientDetails && (
                        <Col span={12} className="mt-4">
                            <div style={{ textAlign: 'left', margin: '10px 0' }}>
                                <p><strong>Name:</strong> {clientDetails.clientName}</p>
                                <p><strong>Address:</strong> {clientDetails.clientAddress || 'N/A'}</p>
                                <p><strong>Phone:</strong> {clientDetails.clientPhone || 'N/A'}</p>
                            </div>
                        </Col>
                        
                    )}
                    <Col span={12} style={{marginTop:"30px"}}>
                                    <div style={{ textAlign: 'left', margin: '10px 0' }}>
                                        <p><strong>Invoice No:</strong> {invoiceNumber}</p>
                                        <p><strong>Date Created:</strong> {new Date().toLocaleDateString()}</p>
                                    </div>
                                </Col>

                    {selectedClient && (
                        <>
                            <Col span={24} className="mt-4">
                                <Row gutter={16} align="middle">
                                    <Col span={8}>
                                        <Select
                                            size='large'
                                            placeholder='Select Brand'
                                            onChange={handleBrandSelect}
                                            value={selectedBrand ? selectedBrand.id : null}
                                        >
                                            {brands.map(brand => (
                                                <Option key={brand.id} value={brand.id}>
                                                    {brand.name}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Col>
                                    <Col span={8}>
                                        <Select
                                            style={{ width: "300px" }}
                                            size='large'
                                            placeholder='Select Variation'
                                            onChange={handleVariationChange}
                                            value={selectedVariation ? selectedVariation.id : null}
                                            disabled={!selectedBrand}
                                        >
                                            {variations.map(variation => (
                                                <Option key={variation.id} value={variation.id}>
                                                    {variation.size} - RS {variation.price}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Col>
                                    <Col span={4} style={{marginLeft:"100px"}}>
                                        <Input
                                            style={{ width: "100px" }}
                                            size='large'
                                            type='number'
                                            min={1}
                                            value={quantity}
                                            onChange={(e) => setQuantity(Number(e.target.value))}
                                        />
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={24} className="mt-4">
                                <Button type='primary' onClick={handleAddItem}>
                                    Add Item
                                </Button>
                            </Col>

                            <Col span={24} className="mt-4">
                                <Table
                                    dataSource={addedItems}
                                    columns={[
                                        { title: 'Item No', dataIndex: 'itemNumber', key: 'itemNumber' },
                                        { title: 'Size', dataIndex: 'size', key: 'size' },
                                        { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
                                        { title: 'Price', dataIndex: 'price', key: 'price' },
                                        { title: 'Subtotal', dataIndex: 'subtotal', key: 'subtotal' },
                                        {
                                            title: 'Action',
                                            render: (text, record, index) => (
                                                <Button danger onClick={() => handleDeleteItem(index)}>
                                                    Delete
                                                </Button>
                                            ),
                                        },
                                    ]}
                                    pagination={false}
                                />
                            </Col>

                            <Col span={24} className="mt-4">
                                <Button type='primary' onClick={handleCalculateTotal}>
                                    Calculate Total
                                </Button>
                            </Col>

                            <Col span={6} className="mt-4" style={{ marginLeft: "73%" }}>
                                <div style={{ textAlign: 'left' }}>
                                    <p><strong>Total:</strong> RS {totalSum}</p>
                                    {!percentageAmount? <></>:  <p><strong>Discount:</strong>- RS {percentageAmount}</p>}
                                    <hr />
                                   {!percentageAmount ?<></>: <p><strong>Bill:</strong> RS {(totalSum - percentageAmount)}</p>}
                                    <p><strong>Previous:</strong> RS {previousBalanceAmount.toFixed(0) }</p>
                                    <hr />
                                    <p><strong>Total Due:</strong> RS {finalAmountDue.toFixed(0)}</p>
                                </div>
                            </Col>
                            <Col><b style={{marginBottom:"-2px"}}>bilti no</b></Col> 
                    <Col span={8}>
                        <Input.TextArea
                            
                            placeholder="Enter bilti number"
                            value={note}
                            onChange={(e) => setNote(e.target.value)} // Handle note input
                        />
                    </Col>
                

                            <Col span={24} className="mt-4">
                                <Button type='primary' loading={isProcessing} onClick={handleUpdateBill}>
                                    Update Bill
                                </Button>
                            </Col>
                        </>
                    )}
                </Row>
            </div>
        </div>
    );
}

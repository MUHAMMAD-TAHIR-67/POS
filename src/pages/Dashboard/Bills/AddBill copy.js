import React, { useState, useEffect, useCallback, useRef } from 'react';

import { Button, Col, Row, Typography, Select, Input, Table, Modal } from 'antd';
import { useAuthContext } from 'contexts/AuthContext';
import { setDoc, doc, serverTimestamp, query, collection, getDocs, where, updateDoc, getDoc } from 'firebase/firestore';
import { firestore } from 'config/firebase';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { orderBy } from 'lodash';

const { Title } = Typography;
const { Option } = Select;

export default function Add() {
    const printRef = useRef();
    const Navigate = useNavigate()
    const { user } = useAuthContext();
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
    const [isProcessing, setIsProcessing] = useState(false);
    const [totalSum, setTotalSum] = useState(0);
    const [percentageAmount, setPercentageAmount] = useState(0);
    const [previousBalance, setPreviousBalance] = useState(0);
    const [finalAmountDue, setFinalAmountDue] = useState(0);
    const [percentage, setPercentage] = useState(0);
    const [difference, setDifference] = useState(0);
    const [price,setPrice]=useState("")
    const [isModalVisible, setIsModalVisible] = useState(false);
    const fetchClients = useCallback(async () => {
        if (user.uid) {
            const q = query(collection(firestore, "clients"), where("user_id", "==", user.uid));
            const querySnapshot = await getDocs(q);
            const clientList = querySnapshot.docs.map(doc => ({
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

    const fetchInvoiceNumber = async () => {
        const billCollection = await getDocs(collection(firestore, "bills"));
        setInvoiceNumber(billCollection.size + 1);
    };

    useEffect(() => {
        fetchClients();
        fetchBrandsAndVariations();
        fetchInvoiceNumber();
    }, [fetchClients]);

    const handleClientSelect = (clientId) => {
        const client = clients.find(c => c.id === clientId);
        if (client) {
            setSelectedClient(client);
            setPreviousBalance(client.previousBalance ? parseFloat(client.previousBalance) : 0);
        } else {
            setPreviousBalance(0);
        }
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

    const handleVariationChange = async(variationId) => {
        const variation = await variations.find(v => v.id === variationId);
        setSelectedVariation(variation);
    };


    const handleAddItem = async () => {
        if (!selectedVariation || quantity <= 0) return;
        let price = prompt("enter your safi rate")
        setPrice(price)
    
        const newItem = {
            itemNumber: addedItems.length + 1,
            size: selectedVariation.size,
            quantity,
            price: price,
            subtotal: price * quantity,
        };

        try {
            await reduceStock(selectedVariation.id, quantity); 
            setAddedItems((prev) => [...prev, newItem]);
        } catch (error) {
            console.error("Error reducing stock:", error);
         
            window.toastify("Not enough stock available", "error");
        }

        setSelectedVariation(null);
        setQuantity(1);
    };

    const reduceStock = async (variationId, quantity) => {
        const variationRef = doc(firestore, 'brands', selectedBrand.id, 'variations', variationId);
        const variationSnapshot = await getDoc(variationRef);
        
        if (variationSnapshot.exists()) {
            const currentStock = variationSnapshot.data().stock;

            if (currentStock >= quantity) {
                await updateDoc(variationRef, { stock: currentStock - quantity });
            } else {
                throw new Error("Not enough stock available");
            }
        } else {
            throw new Error("Variation not found");
        }
    };
  
  const handleOk = () => {

    setIsModalVisible(false);
   
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };


    const handleCalculateTotal = () => {
        const total = addedItems.reduce((acc, item) => acc + item.subtotal, 0);
        setTotalSum(total);

        Modal.confirm({
            title: 'Enter of For Safi calculations',
           
            onOk: () => {
                const percentValue = parseFloat(percentage);
                const calculatedPercentageAmount = (total * percentValue) / 100;
                setPercentageAmount(calculatedPercentageAmount);

                const finalAmount = total + previousBalance;
                setFinalAmountDue(finalAmount);
                setDifference(finalAmount - total);

                
            },
        });
    };

    const handleAddBill = async () => {
        if (!selectedClient) return window.toastify("Please select a client", "error");
        if (addedItems.length === 0) return window.toastify("Please add at least one item", "error");
    
        setIsProcessing(true);
    
        const totalBeforeDiscount = totalSum; 
        const discountAmount = percentageAmount; 
        const finalBillAmount = totalBeforeDiscount - discountAmount; 
        const previousBalanceAmount = previousBalance; 
        const totalAmountDue = totalSum + previousBalanceAmount; 
    
        const billData = {
            client_id: selectedClient.id,
            clientName: selectedClient.clientName,
            invoiceNumber,
            items: addedItems, 
            totalBeforeDiscount, 
             
            previousBalanceAmount, 
            totalAmountDue,  
            user_id: user.uid,
            dateCreated: serverTimestamp(),
        };
        
        
        try {
            
            await setDoc(doc(firestore, "bills", window.getRandomId()), billData);
    
            const newBalance = previousBalanceAmount + finalBillAmount;
    
            await setDoc(doc(firestore, "clients", selectedClient.id), {
                previousBalance: newBalance,
            }, { merge: true });
    
            window.toastify("Bill has been successfully added", "success");
            Navigate('/printbill', { state: { billData } });
          
            setSelectedClient(null);
            setAddedItems([]);
            setVariations([]);
            setSelectedBrand(null);
            setTotalSum(0);
            setPercentageAmount(0);
            setFinalAmountDue(0);
           
        } catch (e) {
            window.toastify("Something went wrong", "error");
            console.error("Error adding document: ", e);
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleSearchClient = (value) => {
        const filtered = clients.filter(client =>
            client.clientName.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredClients(filtered);
    };
    const handlePrint = () => {
        const newWindow = window.open('MUHAMMAD TAHIR', '_blank');
    
     
        const clientDetailsHTML = selectedClient ? `
            <div style="display: flex; height:100px; justify-content: space-between; align-items: flex-start; margin-top:-20px">
                <div style="text-align: left;">
                    <p><strong>Name:</strong> ${selectedClient.clientName}</p>
                    <p><strong>Address:</strong> ${selectedClient.clientAddress || 'N/A'}</p>
                         <p><strong>Phone:</strong> ${selectedClient.clientPhone || 'N/A'}</p>
                </div>
              
            </div>
        ` : '';
    
        const invoiceDetailsHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top:-13%;">
                <div></div>
                <div style="text-align: right;">
                    <p><strong>Invoice No:</strong> ${invoiceNumber}</p>
                    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
            </div>
        `;
    
        const tableHTML = addedItems ? `
            <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="padding: 10px; text-align: center;">#</th>
                        <th style="padding: 10px; text-align: left;">Product</th>
                        <th style="padding: 10px; text-align: center;">Quantity</th>
                        <th style="padding: 10px; text-align: center;">Price</th>
                        <th style="padding: 10px; text-align: center;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${addedItems.map(item => `
                        <tr>
                            <td style="padding: 10px; text-align: center;">${item.itemNumber}</td>
                            <td style="padding: 10px; text-align: left;">${item.size}</td>
                            <td style="padding: 10px; text-align: center;">${item.quantity}</td>
                            <td style="padding: 10px; text-align: center;">${item.price}</td>
                            <td style="padding: 10px; text-align: center;">${item.subtotal}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        ` : '';
    
        const totalHTML = `
            <div style="margin-top: 30px; margin-left: 65%; text-align: right; width: 200px">
                <p><strong>Total:</strong>  ${totalSum}</p>

                <p><strong>Previous:</strong> ${previousBalance.toFixed(0)}</p>
                <hr />
                <p><strong>Total Due:</strong>  ${finalAmountDue.toFixed(0)}</p>
            </div>
        `;
    
        newWindow.document.write(`
            <html>
                <head>
                    <title>Print Bill</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; padding: 0; background-color: #fff; color: #333; }
                        h1 { text-align: center; }
                        table { width: 100%; margin-bottom: 20px; }
                        th, td { text-align: left; border-bottom: 1px solid #ddd; }
                        th { background-color: #f2f2f2; }
                        hr { margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div style="height:70px;margin-top: -15px">               
                     <img src="/5.png" alt=""  style="width: 150px; height: 70px; margin-left:40%"></img>
                     <b style=' margin-left:36%; margin-bottom:-90px'>Jinnah Colony, Faisalabad</b>
                    </div>
                    <div style="height:70px; margin-top:-50px">
                    <b>M.TAHIR:</b>
                    <p style=margin-top:-2px>0317-7662307</p>
                    

                    </div>
                             </div>
                    <div style="height:70px; margin-top:-70px; margin-left:80%">
                    <b>ZIA NAEEM:</b>
                    <p style=margin-top:-2px>0303-5212496</p>
                    

                    </div>
                     <hr />
                    ${clientDetailsHTML}
                    ${invoiceDetailsHTML}
                    ${tableHTML}
                    ${totalHTML}
                    <script>
                        window.onload = function() {
                            window.print();
                            window.close();
                        };
                    </script>
                </body>
            </html>
        `);
    
        newWindow.document.close();
    };
    
    
    const handleDeleteItem = (itemIndex) => {
        setAddedItems((prev) => prev.filter((_, index) => index !== itemIndex));
        
    };
    
    return (
        <div>
             <div>
     
      <Modal
        title="Enter Your Safi Rate"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Input
          placeholder="Type your name safi rate"
          value={price}
          onChange={e => setPrice(e.target.value)}
        />
      </Modal>
    </div>
            <Title level={2}>Add Safi Bill</Title>
            <div className="card card-shadow p-3 p-md-4">
                <Row gutter={16}>
                    <Col span={24}>
                        {selectedClient ? (
                            <Row gutter={16}>
                                <Col span={12}>
                                    <div style={{ textAlign: 'left', margin: '10px 0' ,}}>
                                        <p><strong>Name:</strong> {selectedClient.clientName}</p>
                                        <p><strong>Address:</strong> {selectedClient.clientAddress || 'N/A'}</p>
                                        <p><strong>Phone:</strong> {selectedClient.clientPhone || 'N/A'}</p>
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <div style={{ textAlign: 'left', margin: '10px 0' }}>
                                        <p><strong>Invoice No:</strong> {invoiceNumber}</p>
                                        <p><strong>Date Created:</strong> {new Date().toLocaleDateString()}</p>
                                    </div>
                                </Col>
                            </Row>
                        ) : (
                            <Select
                            size='large'
                            placeholder='Select a client'
                            onChange={handleClientSelect}
                            showSearch
                            filterOption={(input, option) =>
                                option.children.toLowerCase().includes(input.toLowerCase())
                            }
                            style={{ width: '100%' }}
                        >
                            {filteredClients.map(client => (
                                <Option key={client.id} value={client.id}>
                                    {client.clientName}
                                </Option>
                            ))}
                        </Select>
                        
                            
                        )}
                    </Col>

                    {selectedClient && (
                        <>
                            <Col span={24} className="mt-4">
                                <Row gutter={16} align="middle">
                                    <Col span={8}>
                                        <Select
                                        style={{width:"230px"}}
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
                                            style={{ width: "25\s0px" }}
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
                                    <Col span={4} style={{marginLeft:"90px"}}>
                                        <Input
                                        size='large'
                                            style={{ width: "100px" }}
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
                                   
                                    <p><strong>Previous:</strong> RS {previousBalance.toFixed(0)}</p>
                                    <hr />
                                    <p><strong>Total Due:</strong> RS {finalAmountDue.toFixed(0)}</p>
                                </div>
                            </Col>

                            <Col span={24} className="mt-4">
                                <Button  type='primary' loading={isProcessing} onClick={()=>{
                                     handlePrint();
                                     handleAddBill()
                                     
                                }}>
                                    Add Bill
                                </Button>
                            </Col>
                        </>
                    )}
                </Row>

            </div>
            <div ref={printRef} style={{display:"none"}}>
            <h1>Invoice #{invoiceNumber}</h1>
            <h2>Client: {selectedClient ? selectedClient.clientName : 'N/A'}</h2>
            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    {addedItems.map(item => (
                        <tr key={item.itemNumber}>
                            <td>{item.size}</td>
                            <td>{item.quantity}</td>
                            <td>{item.price}</td>
                            <td>{item.subtotal}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <p className="total">Total: {totalSum}</p>
            <p className="total">Discount: {percentageAmount}</p>
            <p className="total">Final Amount Due: {finalAmountDue}</p>
        </div>
      
            
        </div>
    );
}

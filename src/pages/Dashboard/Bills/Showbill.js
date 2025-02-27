import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Col, Row, Typography, Select, Input, Table, Modal } from 'antd';
import { useAuthContext } from 'contexts/AuthContext';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, updateDoc } from 'firebase/firestore';
import { firestore } from 'config/firebase';
import { useParams } from 'react-router-dom';
import Item from 'antd/es/list/Item';

const { Title } = Typography;
const { Option } = Select;

export default function EditBill() {
    const printRef = useRef();
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
        const brandCollection = await getDocs(collection(firestore, 'brands'));
        const brandList = await Promise.all(brandCollection.docs.map(async (doc) => {
            const variationsCollection = await getDocs(collection(firestore, 'brands', doc.id, 'variations'));
            const variationsList = variationsCollection.docs.map(vDoc => ({
                id: vDoc.id,
                brandName: doc.data().name,
                ...vDoc.data(),
            }));
            return { id: doc.id, name: doc.data().name, variations: variationsList };
        }));
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
            setPercentageAmount(billData.discountAmount || 0); // Retrieve discounted amount
            setTotalSum(billData.items.reduce((acc, item) => acc + item.subtotal, 0)); // Calculate total sum
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
        setAddedItems([]); // Reset added items when a new client is selected
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

        const totalAmount = totalSum - percentageAmount; // Total after discount
        const newBalance = previousBalanceAmount  // Calculate new balance
        const discountAmount = percentageAmount
        // Find the selected client to get the name
        const client = clients.find(c => c.id === selectedClient);
        const clientName = client ? client.clientName : '';
        const totalAmountDue = finalAmountDue
        const formData = {
            client_id: selectedClient,
            clientName: clientName, // Add the client name
            invoiceNumber,
            items: addedItems,
            user_id: user.uid,
            previousBalanceAmount: newBalance, 
            discountAmount,  
            totalAmountDue,     // Discount applied (percentage)
             // Update to new balance
            dateUpdated: serverTimestamp(),
            dateCreated: serverTimestamp(),
            note, // Set the creation date
        };

        try {
            await setDoc(doc(firestore, "bills", id), formData); // Update the bill
            await setDoc(doc(firestore, "clients", selectedClient), {
                previousBalanceAmount: newBalance, // Update client's previous balance
            }, { merge: true });

            window.toastify("Bill has been successfully updated", "success");

            // Reset state
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

    const handleSearchClient = (value) => {
        const filtered = clients.filter(client =>
            client.clientName.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredClients(filtered);
    };
    const handlePrint = () => {
        const newWindow = window.open('MUHAMMAD TAHIR', '_blank');
    
        // Client details - Name, Address, Phone
        const clientDetailsHTML = selectedClient ? `
            <div style="display: flex; height:100px; justify-content: space-between; align-items: flex-start; margin-top:-20px">
                <div style="text-align: left;">
                    <p><strong>Name:</strong> ${clientDetails.clientName}</p>
                    <p><strong>Address:</strong> ${clientDetails.clientAddress}</p>
                         <p><strong>Phone:</strong> ${clientDetails.clientPhone }</p>
                </div>
              
            </div>
        ` : '';
    
        // Invoice details - Invoice No, Date Created (now right-aligned)
        const invoiceDetailsHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top:-13%;">
                <div></div>
                <div style="text-align: right;">
                    <p><strong>Invoice No:</strong> ${invoiceNumber}</p>
                    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
            </div>
        `;
    
        // Product table
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
    
        // Total, Discount, Bill breakdown
        const totalHTML = `
            <div style="margin-top: 30px; margin-left: 65%; text-align: right; width: 200px">
                <p><strong>Total:</strong>  ${totalSum}</p>
                    ${percentageAmount ? `<p><strong>Discount:</strong> -${percentageAmount.toFixed(0)}</p>` : ''}
        ${percentageAmount ? `<p><strong>Bill:</strong> ${(totalSum - percentageAmount).toFixed(0)}</p>` : ''}
                <p><strong>Previous:</strong> ${previousBalanceAmount.toFixed(0)}</p>
                <hr />
                <p><strong>Total Due:</strong>  ${finalAmountDue.toFixed(0)}</p>
            </div>
        `;
    
        // Write to new window and trigger print
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
                     <b style=' margin-left:40%; margin-bottom:-90px'>Sadhar, Faisalabad</b>
                    </div>
                    <div style="height:70px; margin-top:-50px">
                    <b>M.TAHIR:</b>
                    <p style=margin-top:-2px>0317-7662307</p>
                   

                    </div>
                             </div>
                    <div style="height:70px; margin-top:-70px; margin-left:80%">
                    <b>ZIA NAEEM:</b>
                    <p style=margin-top:-2px>0310-6044226</p>
                    

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
    
    
    

    const clientDetails = selectedClient ? clients.find(c => c.id === selectedClient) : null;

    return (
        <div>
            <Title level={2}>Show Bill</Title>
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
                                <Table
                                    dataSource={addedItems}
                                    columns={[
                                        { title: 'Item No', dataIndex: 'itemNumber', key: 'itemNumber' },
                                        { title: 'Size', dataIndex: 'size', key: 'size' },
                                        { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
                                        { title: 'Price', dataIndex: 'price', key: 'price' },
                                        { title: 'Subtotal', dataIndex: 'subtotal', key: 'subtotal' },
                                       
                                    ]}
                                    pagination={false}
                                />
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
                            

                            <Col span={24} className="mt-4">
                                <Button type='primary' loading={isProcessing} onClick={handlePrint}>
                                    Print
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
        {/* Other components for adding items, etc. */}
        {/* ... */}
    
            
        </div>
        
        
    );
}

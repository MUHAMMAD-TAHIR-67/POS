import React, { useState, useEffect } from 'react';
import { Input, Button, Typography, Row, Col, Select } from 'antd';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { firestore } from 'config/firebase';

const { Title } = Typography;
const { Option } = Select;

export default function AddBrand() {
    const [brands, setBrands] = useState([]);
    const [brandName, setBrandName] = useState('');
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [size, setSize] = useState('');
    const [price, setPrice] = useState('');
    const [isProcessingBrand, setIsProcessingBrand] = useState(false);
    const [isProcessingVariation, setIsProcessingVariation] = useState(false);

    // Fetch brands from Firestore
    const fetchBrands = async () => {
        const brandCollection = await getDocs(collection(firestore, 'brands'));
        const brandList = await  Promise.all(
            brandCollection.docs.map(async (doc) => {
                const variationsSnapshot = await getDocs(collection(firestore, 'brands', doc.id, 'variations'));
                const variations = variationsSnapshot.docs.map(v => v.data());
                return { id: doc.id, name: doc.data().name, variations };
            })
        );
        setBrands(brandList);
    };

    useEffect(() => {
        fetchBrands();
    }, []);

    

    const handleAddBrand = async () => {
      if (!brandName) return;
    
      setIsProcessingBrand(true);
      try {
        const brandRef = await addDoc(collection(firestore, 'brands'), {
          name: brandName,
          createdAt: serverTimestamp(),
        });
        setBrands((prev) => [...prev, { id: brandRef.id, name: brandName, variations: [] }]);
        setBrandName('');
      } catch (error) {
        console.error("Error adding brand: ", error);
      } finally {
        setIsProcessingBrand(false);
      }
    };
    

    // Handle variation addition
    const handleAddVariation = async () => {
        if (!selectedBrand || !size || !price) return;
      
        setIsProcessingVariation(true);
        try {
          await addDoc(collection(firestore, 'brands', selectedBrand.id, 'variations'), {
            size,
            price: parseFloat(price),
            createdAt: serverTimestamp(),
          });
          setBrands((prev) =>
            prev.map((brand) =>
              brand.id === selectedBrand.id
                ? {
                    ...brand,
                    variations: [...brand.variations, { size, price: parseFloat(price) }],
                  }
                : brand
            )
          );
          setSize('');
          setPrice('');
        } catch (error) {
          console.error("Error adding variation: ", error);
        } finally {
          setIsProcessingVariation(false);
        }
      };
      
    return (
        <div className="container">
            <Title level={2}>Product Management</Title>

            {/* Create Brand Section */}
            <Title level={3}>Create Brand</Title>
            <Row gutter={16}>
                <Col span={16}>
                    <Input
                        placeholder="Enter Brand Name"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                    />
                </Col>
                <Col span={8}>
                    <Button
                        type="primary"
                        onClick={handleAddBrand}
                        disabled={!brandName}
                        loading={isProcessingBrand}
                    >
                        Add Brand
                    </Button>
                </Col>
            </Row>

            {/* Add Variation Section */}
            <Title level={3}>Add Variation</Title>
            <Row gutter={16}>
                <Col className='py-2' span={8}><b>Select Brand:</b></Col>
                <Col className='py-2' span={8}><b>Variation:</b></Col>
                <Col className='py-2' span={8}><b>Price:</b></Col>
                 </Row>
            <Row gutter={16}>
               
                <Col span={8}>
            
                    <Select
                        placeholder="Select Brand"
                        value={selectedBrand ? selectedBrand.id : undefined}
                        onChange={(value) => setSelectedBrand(brands.find(b => b.id === value))}
                    >
                        {brands.map((brand) => (
                            <Option key={brand.id} value={brand.id}>
                                {brand.name}
                            </Option>
                        ))}
                    </Select>
                </Col>
                <Col span={8}>
                    <Input
                        placeholder="Enter Size"
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                    />
                </Col>
                <Col span={8}>
                    <Input
                        placeholder="Enter Price"
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                    />
                </Col>
            </Row>
            <Button
                type="primary"
                onClick={handleAddVariation}
                disabled={!selectedBrand || !size || !price}
                loading={isProcessingVariation}
                className="mt-3"
            >
                Add Variation
            </Button>

            {/* Display Brands and Variations */}
          
        </div>
    );
}

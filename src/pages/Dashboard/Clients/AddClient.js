import React, { useState } from 'react'
import { Button, Col, Form, Input, Row, Typography } from 'antd'
import { useAuthContext } from 'contexts/AuthContext'
import { setDoc, doc, serverTimestamp } from 'firebase/firestore'
import { firestore } from 'config/firebase'

const { Title } = Typography

const initialState = { 
    clientName: "", 
    clientAddress: "", 
    clientPhone: "", 
    previousBalance: "" 
}

export default function AddClient() {
    const { user } = useAuthContext()
    const [state, setState] = useState(initialState)
    const [isProcessing, setIsProcessing] = useState(false)

    const handleChange = e => setState(s => ({ ...s, [e.target.name]: e.target.value }))

    const handleSubmit = async (e) => {
        e.preventDefault();

        let { clientName } = state

        clientName = clientName.trim()

        if (clientName.length < 1) { return window.toastify("Please enter client name", "error") }

        setIsProcessing(true)

        const formData = { ...state }

        createDocument(formData)
    }

    const createDocument = async (data) => {
        const formData = {
            ...data,
            user_id: user.uid,
            id: window.getRandomId(),
            status: "incompleted",
            dateCreated: serverTimestamp()
        }

        try {
            await setDoc(doc(firestore, "clients", formData.id), formData);
            window.toastify("A new client has been successfully added", "success")
            setState(initialState)
        } catch (e) {
            window.toastify("Something went wrong", "error")
            console.error("Error adding document: ", e);
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className='container p-0'>
            <Title level={2}>Add Client</Title>
            <div className="card card-shadow p-3 p-md-4">
                <Form layout="vertical">
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item label="Client Name" required>
                                <Input size='large' type='text' placeholder='Enter client name' name="clientName" value={state.clientName} onChange={handleChange} />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item label="Client Address" required>
                                <Input size='large' type='text' placeholder='Enter client address' name="clientAddress" value={state.clientAddress} onChange={handleChange} />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item label="Client Phone">
                                <Input size='large' type='text' placeholder='Enter client phone' name="clientPhone" value={state.clientPhone} onChange={handleChange} />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item label="Previous Balance">
                                <Input size='large' type='text' placeholder='Enter previous balance' name="previousBalance" value={state.previousBalance} onChange={handleChange} />
                            </Form.Item>
                        </Col>
                        <Col span={24} className='mt-4'>
                            <Button type='primary' size='large' block className='shadow-none' htmlType='submit' loading={isProcessing} onClick={handleSubmit}>Add Client</Button>
                        </Col>
                    </Row>
                </Form>
            </div>
        </div>
    )
}

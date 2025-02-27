import React, { useEffect, useState } from 'react'
import { Button, Col, Form, Input, Row, Typography } from 'antd'
import { setDoc, doc } from 'firebase/firestore'
import { firestore } from 'config/firebase'
import { useAuthContext } from 'contexts/AuthContext'

const { Title } = Typography

const initialState = { fullName: "", email: "", password: "", confirmPassword: "" }

export default function Profile() {

    const { user } = useAuthContext()
    const [state, setState] = useState(initialState)
    const [isProcessing, setIsProcessing] = useState(false)

    const handleChange = e => setState(s => ({ ...s, [e.target.name]: e.target.value }))

    useEffect(() => {
        setState(s => ({ ...s, ...user }))
    }, [user])

    const handleSubmit = async (e) => {
        e.preventDefault();

        let { fullName } = state

        fullName = fullName.trim()

        if (fullName.length < 3) { return window.toastify("Please enter your full name", "error") }

        setIsProcessing(true)

        const formData = { fullName }

        try {
            await setDoc(doc(firestore, "users", user.uid), formData, { merge: true });
            window.toastify("Profile updated", "success")
        } catch (e) {
            console.error("Error adding document: ", e);
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <main className='auth'>
            <div className="card p-3 p-md-4 w-100">
                <Title level={2} className='text-center'>Update Profile</Title>

                <Form layout="vertical">
                    <Row gutter={[16, 16]}>
                        <Col span={24}>
                            <Input size='large' type='text' placeholder='Enter your full name' name="fullName" value={state.fullName} onChange={handleChange} />
                        </Col>
                        <Col span={24}>
                            <Button type='primary' size='large' block htmlType='submit' loading={isProcessing} onClick={handleSubmit}>Update Profile</Button>
                        </Col>
                    </Row>
                </Form>
            </div>
        </main>
    )
}
